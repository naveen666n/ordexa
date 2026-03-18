'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductVariant = sequelize.define('ProductVariant', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  product_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  sku: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(255), allowNull: true },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  compare_price: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  cost_price: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  stock_quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  low_stock_threshold: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: 'product_variants',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = ProductVariant;
