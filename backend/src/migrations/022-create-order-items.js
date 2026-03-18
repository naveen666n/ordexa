'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('order_items', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      order_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onDelete: 'CASCADE',
      },
      variant_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true, // nullable — variant might be deleted later
        references: { model: 'product_variants', key: 'id' },
        onDelete: 'SET NULL',
      },
      // Snapshot fields — preserve what was ordered regardless of future product changes
      product_name: { type: Sequelize.STRING(255), allowNull: false },
      variant_info: { type: Sequelize.JSON, allowNull: true }, // { sku, name, attributes: [...] }
      sku: { type: Sequelize.STRING(100), allowNull: true },
      unit_price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      offer_discount: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      quantity: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      line_total: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      image_url: { type: Sequelize.STRING(500), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('order_items', ['order_id']);
  },
  async down(queryInterface) { await queryInterface.dropTable('order_items'); },
};
