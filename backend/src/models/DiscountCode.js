'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DiscountCode = sequelize.define('DiscountCode', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  code: { type: DataTypes.STRING(60), allowNull: false, unique: true },
  offer_type: {
    type: DataTypes.ENUM('PERCENT', 'FIXED', 'FREE_SHIPPING'),
    allowNull: false,
  },
  discount_value: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  min_order_value: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  max_uses: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  per_user_limit: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
  current_uses: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  starts_at: { type: DataTypes.DATE, allowNull: true },
  ends_at: { type: DataTypes.DATE, allowNull: true },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: 'discount_codes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = DiscountCode;
