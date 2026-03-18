'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  action: { type: DataTypes.STRING(100), allowNull: false },
  entity_type: { type: DataTypes.STRING(60), allowNull: true },
  entity_id: { type: DataTypes.STRING(60), allowNull: true },
  old_value: { type: DataTypes.JSON, allowNull: true },
  new_value: { type: DataTypes.JSON, allowNull: true },
  ip_address: { type: DataTypes.STRING(45), allowNull: true },
  user_agent: { type: DataTypes.STRING(500), allowNull: true },
}, { tableName: 'audit_logs', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

module.exports = AuditLog;
