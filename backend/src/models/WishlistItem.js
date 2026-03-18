'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WishlistItem = sequelize.define('WishlistItem', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  variant_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
}, {
  tableName: 'wishlist_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = WishlistItem;
