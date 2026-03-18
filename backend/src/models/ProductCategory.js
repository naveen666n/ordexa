'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductCategory = sequelize.define('ProductCategory', {
  product_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true },
  category_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true },
}, {
  tableName: 'product_categories',
  timestamps: false,
});

module.exports = ProductCategory;
