'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('addresses', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      label: { type: Sequelize.STRING(60), allowNull: true, defaultValue: null }, // e.g. "Home", "Office"
      full_name: { type: Sequelize.STRING(150), allowNull: false },
      phone: { type: Sequelize.STRING(20), allowNull: true },
      address_line1: { type: Sequelize.STRING(255), allowNull: false },
      address_line2: { type: Sequelize.STRING(255), allowNull: true },
      city: { type: Sequelize.STRING(100), allowNull: false },
      state: { type: Sequelize.STRING(100), allowNull: false },
      postal_code: { type: Sequelize.STRING(20), allowNull: false },
      country: { type: Sequelize.STRING(100), allowNull: false, defaultValue: 'India' },
      is_default: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('addresses', ['user_id']);
  },
  async down(queryInterface) { await queryInterface.dropTable('addresses'); },
};
