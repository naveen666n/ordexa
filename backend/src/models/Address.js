'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Address = sequelize.define('Address', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  label: { type: DataTypes.STRING(60), allowNull: true },
  full_name: { type: DataTypes.STRING(150), allowNull: false },
  phone: { type: DataTypes.STRING(20), allowNull: true },
  address_line1: { type: DataTypes.STRING(255), allowNull: false },
  address_line2: { type: DataTypes.STRING(255), allowNull: true },
  city: { type: DataTypes.STRING(100), allowNull: false },
  state: { type: DataTypes.STRING(100), allowNull: false },
  postal_code: { type: DataTypes.STRING(20), allowNull: false },
  country: { type: DataTypes.STRING(100), allowNull: false, defaultValue: 'India' },
  is_default: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, { tableName: 'addresses', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

module.exports = Address;
