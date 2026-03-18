'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  order_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  variant_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  product_name: { type: DataTypes.STRING(255), allowNull: false },
  variant_info: { type: DataTypes.JSON, allowNull: true },
  sku: { type: DataTypes.STRING(100), allowNull: true },
  unit_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  offer_discount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  line_total: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  image_url: { type: DataTypes.STRING(500), allowNull: true },
}, { tableName: 'order_items', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

module.exports = OrderItem;
