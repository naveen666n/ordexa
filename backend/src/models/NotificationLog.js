'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const NotificationLog = sequelize.define('NotificationLog', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  type: { type: DataTypes.ENUM('email', 'sms'), allowNull: false },
  recipient: { type: DataTypes.STRING(255), allowNull: false },
  subject: { type: DataTypes.STRING(255), allowNull: true },
  template_key: { type: DataTypes.STRING(100), allowNull: true },
  status: { type: DataTypes.ENUM('sent', 'failed'), allowNull: false },
  error_message: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'notification_logs', timestamps: true, createdAt: 'created_at', updatedAt: false });
module.exports = NotificationLog;
