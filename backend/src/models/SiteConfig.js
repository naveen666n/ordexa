'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SiteConfig = sequelize.define('SiteConfig', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  group: { type: DataTypes.STRING(50), allowNull: false },
  key: { type: DataTypes.STRING(100), allowNull: false },
  value: { type: DataTypes.TEXT('long'), allowNull: true },
  value_type: { type: DataTypes.ENUM('string', 'number', 'boolean', 'json'), defaultValue: 'string' },
  is_secret: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'site_config',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = SiteConfig;
