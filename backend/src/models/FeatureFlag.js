'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FeatureFlag = sequelize.define('FeatureFlag', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  description: { type: DataTypes.STRING(255), allowNull: true },
}, {
  tableName: 'feature_flags',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = FeatureFlag;
