'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PAYMENT_STATUSES = ['initiated', 'captured', 'failed', 'refunded', 'partially_refunded'];

const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  order_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  gateway: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'razorpay' },
  gateway_order_id: { type: DataTypes.STRING(100), allowNull: true, unique: true },
  gateway_payment_id: { type: DataTypes.STRING(100), allowNull: true },
  gateway_signature: { type: DataTypes.STRING(255), allowNull: true },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  currency: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'INR' },
  status: {
    type: DataTypes.ENUM(...PAYMENT_STATUSES),
    allowNull: false,
    defaultValue: 'initiated',
  },
  payment_method: { type: DataTypes.STRING(60), allowNull: true },
  failure_reason: { type: DataTypes.TEXT, allowNull: true },
  refund_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  raw_webhook_payload: { type: DataTypes.JSON, allowNull: true },
}, {
  tableName: 'payments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

Payment.PAYMENT_STATUSES = PAYMENT_STATUSES;
module.exports = Payment;
