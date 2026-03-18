'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ShippingRule = sequelize.define('ShippingRule', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  strategy: {
    type: DataTypes.ENUM('flat_rate', 'free'),
    allowNull: false,
    defaultValue: 'flat_rate',
  },
  config: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: 'shipping_rules',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = ShippingRule;
