'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReviewMedia = sequelize.define('ReviewMedia', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  review_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  url: { type: DataTypes.STRING(500), allowNull: false },
  media_type: {
    type: DataTypes.ENUM('image', 'video'),
    allowNull: false,
    defaultValue: 'image',
  },
}, {
  tableName: 'review_media',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = ReviewMedia;
