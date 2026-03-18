'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductImage = sequelize.define('ProductImage', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  product_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  variant_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  url: { type: DataTypes.STRING(500), allowNull: false },
  alt_text: { type: DataTypes.STRING(255), allowNull: true },
  is_primary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  sort_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
}, {
  tableName: 'product_images',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = ProductImage;
