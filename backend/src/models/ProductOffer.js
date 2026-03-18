'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductOffer = sequelize.define('ProductOffer', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  product_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  offer_type: {
    type: DataTypes.ENUM('PERCENT', 'FIXED', 'FREE_SHIPPING', 'BXGY'),
    allowNull: false,
  },
  discount_value: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  buy_quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  get_quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  min_order_value: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  starts_at: { type: DataTypes.DATE, allowNull: true },
  ends_at: { type: DataTypes.DATE, allowNull: true },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: 'product_offers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = ProductOffer;
