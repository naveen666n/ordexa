'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('feature_flags', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      key: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      description: { type: Sequelize.STRING(255), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
  },
  async down(queryInterface) { await queryInterface.dropTable('feature_flags'); }
};
