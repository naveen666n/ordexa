'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notification_logs', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      type: { type: Sequelize.ENUM('email', 'sms'), allowNull: false },
      recipient: { type: Sequelize.STRING(255), allowNull: false },
      subject: { type: Sequelize.STRING(255), allowNull: true },
      template_key: { type: Sequelize.STRING(100), allowNull: true },
      status: { type: Sequelize.ENUM('sent', 'failed'), allowNull: false },
      error_message: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('notification_logs'); }
};
