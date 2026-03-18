'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VariantAttributeValue = sequelize.define('VariantAttributeValue', {
  variant_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true },
  attribute_value_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true },
}, {
  tableName: 'variant_attribute_values',
  timestamps: false,
});

module.exports = VariantAttributeValue;
