'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GlobalOffer = sequelize.define('GlobalOffer', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
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
  precedence: {
    type: DataTypes.ENUM('global_wins', 'product_wins', 'best_deal'),
    allowNull: false,
    defaultValue: 'best_deal',
  },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  tableName: 'global_offers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = GlobalOffer;
