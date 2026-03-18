'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ORDER_STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];

const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  order_number: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  address_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  address_snapshot: { type: DataTypes.JSON, allowNull: true },
  status: { type: DataTypes.ENUM(...ORDER_STATUSES), allowNull: false, defaultValue: 'pending' },
  subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  discount_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  discount_source: { type: DataTypes.STRING(100), allowNull: true },
  coupon_code: { type: DataTypes.STRING(60), allowNull: true },
  shipping_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  tax_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  total_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'orders', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

Order.ORDER_STATUSES = ORDER_STATUSES;
module.exports = Order;
