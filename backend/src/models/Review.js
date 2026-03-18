'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Review = sequelize.define('Review', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  product_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  rating: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    validate: { min: 1, max: 5 },
  },
  title: { type: DataTypes.STRING(255), allowNull: true },
  body: { type: DataTypes.TEXT, allowNull: true },
  is_approved: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  tableName: 'reviews',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Review;
