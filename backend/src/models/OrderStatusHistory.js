'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderStatusHistory = sequelize.define('OrderStatusHistory', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  order_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  from_status: {
    type: DataTypes.ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'),
    allowNull: true,
  },
  to_status: {
    type: DataTypes.ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'),
    allowNull: false,
  },
  changed_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  note: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'order_status_history', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

module.exports = OrderStatusHistory;
