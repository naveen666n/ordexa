'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cms_content', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      section: { type: Sequelize.STRING(50), allowNull: false },
      key: { type: Sequelize.STRING(100), allowNull: false },
      value: { type: Sequelize.TEXT('long'), allowNull: true },
      value_type: { type: Sequelize.ENUM('string','json','html'), defaultValue: 'string' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('cms_content', ['section', 'key'], { unique: true, name: 'cms_content_section_key_unique' });
  },
  async down(queryInterface) { await queryInterface.dropTable('cms_content'); }
};
