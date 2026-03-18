'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('audit_logs', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: Sequelize.INTEGER.UNSIGNED, allowNull: true },
      action: { type: Sequelize.STRING(100), allowNull: false }, // e.g. 'ORDER_STATUS_UPDATE'
      entity_type: { type: Sequelize.STRING(60), allowNull: true }, // e.g. 'order'
      entity_id: { type: Sequelize.STRING(60), allowNull: true }, // e.g. order_number
      old_value: { type: Sequelize.JSON, allowNull: true },
      new_value: { type: Sequelize.JSON, allowNull: true },
      ip_address: { type: Sequelize.STRING(45), allowNull: true },
      user_agent: { type: Sequelize.STRING(500), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('audit_logs', ['user_id']);
    await queryInterface.addIndex('audit_logs', ['entity_type', 'entity_id']);
  },
  async down(queryInterface) { await queryInterface.dropTable('audit_logs'); },
};
