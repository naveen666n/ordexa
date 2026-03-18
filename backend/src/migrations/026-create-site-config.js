'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('site_config', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      group: { type: Sequelize.STRING(50), allowNull: false },
      key: { type: Sequelize.STRING(100), allowNull: false },
      value: { type: Sequelize.TEXT('long'), allowNull: true },
      value_type: { type: Sequelize.ENUM('string','number','boolean','json'), defaultValue: 'string' },
      is_secret: { type: Sequelize.BOOLEAN, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('site_config', ['group', 'key'], { unique: true, name: 'site_config_group_key_unique' });
  },
  async down(queryInterface) { await queryInterface.dropTable('site_config'); }
};
