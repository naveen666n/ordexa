'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('order_status_history', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      order_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onDelete: 'CASCADE',
      },
      from_status: {
        type: Sequelize.ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'),
        allowNull: true, // null for the initial entry
      },
      to_status: {
        type: Sequelize.ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'),
        allowNull: false,
      },
      changed_by: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true }, // user_id who made the change
      note: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('order_status_history', ['order_id']);
  },
  async down(queryInterface) { await queryInterface.dropTable('order_status_history'); },
};
