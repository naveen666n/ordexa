'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_variants', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
      product_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      sku: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      name: { type: Sequelize.STRING(255), allowNull: true },
      price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      compare_price: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      cost_price: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      stock_quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      low_stock_threshold: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 5 },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_variants');
  },
};
