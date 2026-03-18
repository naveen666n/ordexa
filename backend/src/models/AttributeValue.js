'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AttributeValue = sequelize.define(
  'AttributeValue',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    attribute_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    value: { type: DataTypes.STRING(200), allowNull: false },
    slug: { type: DataTypes.STRING(220), allowNull: false },
    color_hex: { type: DataTypes.STRING(7), allowNull: true },
    sort_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: 'attribute_values',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = AttributeValue;
