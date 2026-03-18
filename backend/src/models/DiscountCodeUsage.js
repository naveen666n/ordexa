'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DiscountCodeUsage = sequelize.define('DiscountCodeUsage', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  discount_code_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  order_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
}, {
  tableName: 'discount_code_usage',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = DiscountCodeUsage;
