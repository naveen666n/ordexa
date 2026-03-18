'use strict';

const { sequelize } = require('../../models');
const { QueryTypes } = require('sequelize');
const { success } = require('../../utils/response');

const getStats = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      ordersToday,
      revenueMonth,
      totalProducts,
      lowStockAlerts,
      pendingReviews,
      recentOrders,
    ] = await Promise.all([
      // Total orders placed today
      sequelize.query(
        `SELECT COUNT(*) as count FROM orders WHERE created_at >= ?`,
        { replacements: [todayStart], type: QueryTypes.SELECT }
      ),
      // Revenue this month (paid/processing/shipped/delivered)
      sequelize.query(
        `SELECT COALESCE(SUM(total_amount), 0) as total
         FROM orders
         WHERE created_at >= ? AND status IN ('paid','processing','shipped','delivered')`,
        { replacements: [monthStart], type: QueryTypes.SELECT }
      ),
      // Total active products
      sequelize.query(
        `SELECT COUNT(*) as count FROM products WHERE is_active = 1`,
        { replacements: [], type: QueryTypes.SELECT }
      ),
      // Variants with stock <= low_stock_threshold (and > 0 so not out-of-stock)
      sequelize.query(
        `SELECT COUNT(*) as count
         FROM product_variants pv
         WHERE pv.is_active = 1
           AND pv.stock_quantity > 0
           AND pv.stock_quantity <= pv.low_stock_threshold`,
        { replacements: [], type: QueryTypes.SELECT }
      ),
      // Reviews pending approval
      sequelize.query(
        `SELECT COUNT(*) as count FROM reviews WHERE is_approved = 0`,
        { replacements: [], type: QueryTypes.SELECT }
      ),
      // Last 5 orders for quick overview
      sequelize.query(
        `SELECT o.id, o.order_number, o.status, o.total_amount, o.created_at,
                u.first_name, u.last_name, u.email
         FROM orders o
         JOIN users u ON u.id = o.user_id
         ORDER BY o.created_at DESC
         LIMIT 5`,
        { replacements: [], type: QueryTypes.SELECT }
      ),
    ]);

    return success(res, {
      orders_today: Number(ordersToday[0].count),
      revenue_this_month: Number(revenueMonth[0].total),
      total_products: Number(totalProducts[0].count),
      low_stock_alerts: Number(lowStockAlerts[0].count),
      pending_reviews: Number(pendingReviews[0].count),
      recent_orders: recentOrders,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getStats };
