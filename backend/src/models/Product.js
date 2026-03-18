'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  slug: { type: DataTypes.STRING(300), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  brand: { type: DataTypes.STRING(100), allowNull: true },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  is_featured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  meta_title: { type: DataTypes.STRING(255), allowNull: true },
  meta_description: { type: DataTypes.STRING(500), allowNull: true },
  sort_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
}, {
  tableName: 'products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Product;
