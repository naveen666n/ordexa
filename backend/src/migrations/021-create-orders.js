'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      order_number: { type: Sequelize.STRING(30), allowNull: false, unique: true },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      address_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: { model: 'addresses', key: 'id' },
        onDelete: 'SET NULL',
      },
      // Snapshot of address at order time (in case address is deleted/changed later)
      address_snapshot: { type: Sequelize.JSON, allowNull: true },
      status: {
        type: Sequelize.ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      // Price breakdown snapshot
      subtotal: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      discount_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      discount_source: { type: Sequelize.STRING(100), allowNull: true },
      coupon_code: { type: Sequelize.STRING(60), allowNull: true },
      shipping_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      tax_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      total_amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('orders', ['user_id']);
    await queryInterface.addIndex('orders', ['status']);
    await queryInterface.addIndex('orders', ['order_number']);
  },
  async down(queryInterface) { await queryInterface.dropTable('orders'); },
};
