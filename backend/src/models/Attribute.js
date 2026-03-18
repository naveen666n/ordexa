'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Attribute = sequelize.define(
  'Attribute',
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    type: {
      type: DataTypes.ENUM('select', 'multiselect', 'text', 'number', 'boolean'),
      allowNull: false,
      defaultValue: 'select',
    },
    is_filterable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    is_visible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    sort_order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: 'attributes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = Attribute;
