'use strict';

const ordersService = require('./orders.service');
const { success } = require('../../utils/response');

// ─── Customer ─────────────────────────────────────────────────────────────────

const createOrder = async (req, res, next) => {
  try {
    const { order, paymentInitiation } = await ordersService.createOrder(req.user.id, req.body);
    return success(res, { order, payment_initiation: paymentInitiation }, 'Order placed successfully', 201);
  } catch (err) { next(err); }
};

const listOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await ordersService.listOrders(req.user.id, { page, limit });
    return success(res, result);
  } catch (err) { next(err); }
};

const getOrder = async (req, res, next) => {
  try {
    const order = await ordersService.getOrderByNumber(req.params.orderNumber, req.user.id);
    return success(res, { order });
  } catch (err) { next(err); }
};

const cancelOrder = async (req, res, next) => {
  try {
    const { order, refund } = await ordersService.cancelOrder(req.params.orderNumber, req.user.id);
    return success(res, { order, refund }, 'Order cancelled');
  } catch (err) { next(err); }
};

// ─── Operations ───────────────────────────────────────────────────────────────

const listAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, from, to } = req.query;
    const result = await ordersService.listAllOrders({
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      from,
      to,
    });
    return success(res, result);
  } catch (err) { next(err); }
};

const getOrderDetail = async (req, res, next) => {
  try {
    const order = await ordersService.getOrderByNumber(req.params.orderNumber);
    return success(res, { order });
  } catch (err) { next(err); }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    req.auditData = {
      entityId: req.params.orderNumber,
      oldValue: { status: req.body._prevStatus },
      newValue: { status },
    };
    const order = await ordersService.updateOrderStatus(
      req.params.orderNumber,
      status,
      req.user.id,
      note
    );
    return success(res, { order }, 'Order status updated');
  } catch (err) { next(err); }
};

const getProductOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await ordersService.getProductOrders(req.params.id, { page, limit });
    return success(res, result);
  } catch (err) { next(err); }
};

module.exports = {
  createOrder,
  listOrders,
  getOrder,
  cancelOrder,
  listAllOrders,
  getOrderDetail,
  updateOrderStatus,
  getProductOrders,
};
