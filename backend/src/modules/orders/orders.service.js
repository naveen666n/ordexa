'use strict';

const { sequelize, Order, OrderItem, OrderStatusHistory, ProductVariant, Address, User, Payment } = require('../../models');
const notificationsService = require('../notifications/notifications.service');
const paymentService = require('../payments/payment.service');
const cartRepo = require('../cart/cart.repository');
const cartService = require('../cart/cart.service');
const offerEngine = require('../discounts/offer.engine');
const couponService = require('../discounts/coupon.service');
const shippingService = require('../shipping/shipping.service');
const taxService = require('../tax/tax.service');
const { generateOrderNumber } = require('../../utils/orderNumber');
const { validateTransition, validateCancellable } = require('./status.validator');
const { getCancellableStatuses } = require('../config/config.service');
const { AppError } = require('../../utils/errors');
const { Op } = require('sequelize');

const INVENTORY_BLOCKING = process.env.INVENTORY_BLOCKING_ENABLED !== 'false';

// ─── createOrder ──────────────────────────────────────────────────────────────

const createOrder = async (userId, { address_id, coupon_code, notes } = {}) => {
  // 1. Load cart items
  const rawItems = await cartRepo.findCartItems(userId);
  if (!rawItems.length) throw new AppError('Cart is empty.', 400, 'EMPTY_CART');

  // 2. Validate stock + resolve offers per item
  const resolvedItems = [];
  for (const cartItem of rawItems) {
    const variant = cartItem.variant;
    const product = variant?.product;
    if (!variant || !product) continue;

    if (INVENTORY_BLOCKING && variant.stock_quantity < cartItem.quantity) {
      throw new AppError(
        `"${product.name}" only has ${variant.stock_quantity} units available.`,
        400,
        'INSUFFICIENT_STOCK'
      );
    }

    const unitPrice = Number(variant.price);
    const qty = cartItem.quantity;
    const { discount } = await offerEngine.resolveOffer(product.id, unitPrice, qty);
    const offerDiscount = Math.round(discount * 100) / 100;
    const lineTotal = Math.round((unitPrice * qty - offerDiscount) * 100) / 100;

    // Build variant_info snapshot for immutable order history
    const variantInfo = {
      sku: variant.sku,
      name: variant.name,
      price: unitPrice,
    };

    resolvedItems.push({
      variant_id: variant.id,
      product_id: product.id,
      product_name: product.name,
      variant_info: variantInfo,
      sku: variant.sku,
      unit_price: unitPrice,
      offer_discount: offerDiscount,
      quantity: qty,
      line_total: lineTotal,
      image_url: product.images?.[0]?.url || null,
      stock_quantity: variant.stock_quantity,
    });
  }

  const subtotal = resolvedItems.reduce((s, i) => s + i.line_total, 0);

  // 3. Validate coupon (use stored coupon from cart service if coupon_code not provided)
  const storedCoupon = coupon_code
    ? null
    : cartService.getCouponForUser(userId);

  const effectiveCouponCode = coupon_code || storedCoupon?.code;
  let couponRecord = null;
  let couponDiscount = 0;
  let couponFreeShipping = false;
  let discountSource = null;

  if (effectiveCouponCode) {
    try {
      couponRecord = await couponService.validateCoupon(effectiveCouponCode, userId, subtotal);
      const result = couponService.calculateCouponDiscount(couponRecord, subtotal);
      couponDiscount = result.discount_amount;
      couponFreeShipping = result.free_shipping;
      discountSource = `Coupon: ${effectiveCouponCode.toUpperCase()}`;
    } catch (err) {
      // Coupon invalid at order time — proceed without it
    }
  }

  const subtotalAfterCoupon = Math.max(0, subtotal - couponDiscount);

  // 4. Get address + snapshot
  let addressSnapshot = null;
  if (address_id) {
    const address = await Address.findOne({ where: { id: address_id, user_id: userId } });
    if (!address) throw new AppError('Address not found.', 404, 'NOT_FOUND');
    addressSnapshot = {
      full_name: address.full_name,
      phone: address.phone,
      address_line1: address.address_line1,
      address_line2: address.address_line2,
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
    };
  }

  // 5. Shipping + Tax
  const taxItems = resolvedItems.map((i) => ({ subtotal_after_discount: i.line_total }));
  const [shippingAmount, taxAmount] = await Promise.all([
    shippingService.calculate(subtotalAfterCoupon, couponFreeShipping),
    taxService.calculate(taxItems),
  ]);

  const totalAmount = Math.round((subtotalAfterCoupon + shippingAmount + taxAmount) * 100) / 100;

  // ─── Atomic transaction ───────────────────────────────────────────────────
  const order = await sequelize.transaction(async (t) => {
    const orderNumber = await generateOrderNumber(t);

    // 6. Create order
    const newOrder = await Order.create({
      order_number: orderNumber,
      user_id: userId,
      address_id: address_id || null,
      address_snapshot: addressSnapshot,
      status: 'pending',
      subtotal: Math.round(subtotal * 100) / 100,
      discount_amount: Math.round(couponDiscount * 100) / 100,
      discount_source: discountSource,
      coupon_code: effectiveCouponCode ? effectiveCouponCode.toUpperCase() : null,
      shipping_amount: Math.round(shippingAmount * 100) / 100,
      tax_amount: Math.round(taxAmount * 100) / 100,
      total_amount: totalAmount,
      notes: notes || null,
    }, { transaction: t });

    // 7. Create order items (snapshot)
    await OrderItem.bulkCreate(
      resolvedItems.map((i) => ({
        order_id: newOrder.id,
        variant_id: i.variant_id,
        product_name: i.product_name,
        variant_info: i.variant_info,
        sku: i.sku,
        unit_price: i.unit_price,
        offer_discount: i.offer_discount,
        quantity: i.quantity,
        line_total: i.line_total,
        image_url: i.image_url,
      })),
      { transaction: t }
    );

    // 8. Decrement stock
    for (const item of resolvedItems) {
      await ProductVariant.decrement('stock_quantity', {
        by: item.quantity,
        where: { id: item.variant_id },
        transaction: t,
      });
    }

    // 9. Initial status history entry
    await OrderStatusHistory.create({
      order_id: newOrder.id,
      from_status: null,
      to_status: 'pending',
      changed_by: userId,
      note: 'Order created',
    }, { transaction: t });

    return newOrder;
  });

  // 10. Record coupon usage + clear cart (outside transaction — non-critical)
  if (couponRecord) {
    await couponService.recordUsage(couponRecord.id, userId, order.id).catch(() => {});
  }
  await cartRepo.clearCart(userId);
  cartService.clearCouponStore(userId);

  // 11. Initiate payment — create gateway order
  let paymentInitiation = null;
  try {
    paymentInitiation = await paymentService.initiatePayment(order);
  } catch (err) {
    // Non-blocking: if gateway is misconfigured, order still succeeds
    // Frontend will show retry payment option
  }

  // Return order with items + payment initiation data
  const fullOrder = await getOrderByNumber(order.order_number, userId);

  // Non-blocking — must not break order creation
  notificationsService.sendOrderConfirmation(fullOrder, null).catch(() => {});

  return { order: fullOrder, paymentInitiation };
};

// ─── getOrderByNumber ─────────────────────────────────────────────────────────

const getOrderByNumber = async (orderNumber, userId = null) => {
  const where = { order_number: orderNumber };
  if (userId) where.user_id = userId;

  const order = await Order.findOne({
    where,
    include: [
      { model: OrderItem, as: 'items' },
      {
        model: OrderStatusHistory,
        as: 'statusHistory',
        order: [['created_at', 'ASC']],
        include: [{ model: User, as: 'changedByUser', attributes: ['id', 'first_name', 'last_name'] }],
      },
      { model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email'] },
      { model: Payment, as: 'payment' },
    ],
  });
  if (!order) throw new AppError('Order not found.', 404, 'NOT_FOUND');
  return order;
};

// ─── listOrders (customer) ────────────────────────────────────────────────────

const listOrders = async (userId, { page = 1, limit = 10 } = {}) => {
  const offset = (page - 1) * limit;
  const { rows: orders, count: total } = await Order.findAndCountAll({
    where: { user_id: userId },
    include: [{ model: OrderItem, as: 'items' }],
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });
  return {
    orders,
    pagination: { total, page, limit, total_pages: Math.ceil(total / limit) },
  };
};

// ─── cancelOrder (customer) ───────────────────────────────────────────────────

const cancelOrder = async (orderNumber, userId) => {
  const order = await Order.findOne({
    where: { order_number: orderNumber, user_id: userId },
    include: [{ model: Payment, as: 'payment' }],
  });
  if (!order) throw new AppError('Order not found.', 404, 'NOT_FOUND');

  const cancellableStatuses = await getCancellableStatuses();
  validateCancellable(order.status, cancellableStatuses);

  await sequelize.transaction(async (t) => {
    const prevStatus = order.status;
    await order.update({ status: 'cancelled' }, { transaction: t });

    // Restore stock
    const items = await OrderItem.findAll({ where: { order_id: order.id }, transaction: t });
    for (const item of items) {
      if (item.variant_id) {
        await ProductVariant.increment('stock_quantity', {
          by: item.quantity,
          where: { id: item.variant_id },
          transaction: t,
        });
      }
    }

    await OrderStatusHistory.create({
      order_id: order.id,
      from_status: prevStatus,
      to_status: 'cancelled',
      changed_by: userId,
      note: 'Cancelled by customer',
    }, { transaction: t });
  });

  // Auto-refund if payment was captured (non-blocking — cancellation succeeds regardless)
  let refund = null;
  const payment = order.payment;
  if (payment && payment.status === 'captured') {
    try {
      const refundResult = await paymentService.processRefund(payment.id, Number(payment.amount));
      refund = {
        status: 'refunded',
        amount: Number(payment.amount),
        gateway_refund_id: refundResult.refundResult?.id || null,
        message: 'Refund initiated successfully. Amount will be credited within 5-7 business days.',
      };
    } catch (err) {
      console.error('[cancelOrder] Auto-refund failed:', err.message);
      refund = {
        status: 'failed',
        message: 'Cancellation successful but refund could not be initiated. Please contact support.',
      };
    }
  }

  const updatedOrder = await getOrderByNumber(orderNumber, userId);
  return { order: updatedOrder, refund };
};

// ─── updateOrderStatus (operations) ──────────────────────────────────────────

const updateOrderStatus = async (orderNumber, toStatus, changedBy, note = null) => {
  const order = await Order.findOne({ where: { order_number: orderNumber } });
  if (!order) throw new AppError('Order not found.', 404, 'NOT_FOUND');

  validateTransition(order.status, toStatus);

  const prevStatus = order.status;

  await sequelize.transaction(async (t) => {
    await order.update({ status: toStatus }, { transaction: t });

    // Restore stock if cancelling from operations
    if (toStatus === 'cancelled') {
      const items = await OrderItem.findAll({ where: { order_id: order.id }, transaction: t });
      for (const item of items) {
        if (item.variant_id) {
          await ProductVariant.increment('stock_quantity', {
            by: item.quantity,
            where: { id: item.variant_id },
            transaction: t,
          });
        }
      }
    }

    await OrderStatusHistory.create({
      order_id: order.id,
      from_status: prevStatus,
      to_status: toStatus,
      changed_by: changedBy,
      note: note || null,
    }, { transaction: t });
  });

  const updatedOrder = await getOrderByNumber(orderNumber);

  // Non-blocking
  notificationsService.sendOrderStatusUpdate(updatedOrder, null, toStatus).catch(() => {});

  return updatedOrder;
};

// ─── listAllOrders (admin / operations) ──────────────────────────────────────

const listAllOrders = async ({ page = 1, limit = 20, status, from, to } = {}) => {
  const offset = (page - 1) * limit;
  const where = {};
  if (status) where.status = status;
  if (from || to) {
    where.created_at = {};
    if (from) where.created_at[Op.gte] = new Date(from);
    if (to) where.created_at[Op.lte] = new Date(to);
  }

  const { rows: orders, count: total } = await Order.findAndCountAll({
    where,
    include: [
      { model: OrderItem, as: 'items' },
      { model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email'] },
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });
  return {
    orders,
    pagination: { total, page, limit, total_pages: Math.ceil(total / limit) },
  };
};

// ─── getProductOrders (admin) ─────────────────────────────────────────────────

const getProductOrders = async (productId, { page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;

  const variants = await ProductVariant.findAll({
    where: { product_id: productId },
    attributes: ['id'],
  });
  const variantIds = variants.map((v) => v.id);

  if (!variantIds.length) {
    return { orders: [], pagination: { total: 0, page, limit, total_pages: 0 } };
  }

  const { rows: orders, count: total } = await Order.findAndCountAll({
    include: [
      {
        model: OrderItem,
        as: 'items',
        where: { variant_id: { [Op.in]: variantIds } },
        required: true,
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'first_name', 'last_name', 'email'],
      },
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset,
    distinct: true,
  });

  return {
    orders,
    pagination: { total, page, limit, total_pages: Math.ceil(total / limit) },
  };
};

module.exports = {
  createOrder,
  getOrderByNumber,
  listOrders,
  cancelOrder,
  updateOrderStatus,
  listAllOrders,
  getProductOrders,
};
