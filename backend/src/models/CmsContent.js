'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CmsContent = sequelize.define('CmsContent', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  section: { type: DataTypes.STRING(50), allowNull: false },
  key: { type: DataTypes.STRING(100), allowNull: false },
  value: { type: DataTypes.TEXT('long'), allowNull: true },
  value_type: { type: DataTypes.ENUM('string', 'json', 'html'), defaultValue: 'string' },
}, {
  tableName: 'cms_content',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = CmsContent;
