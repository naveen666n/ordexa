'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TaxRule = sequelize.define('TaxRule', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  region: { type: DataTypes.STRING(10), allowNull: true },
  category_slug: { type: DataTypes.STRING(100), allowNull: true },
  rate: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: 'tax_rules',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = TaxRule;
