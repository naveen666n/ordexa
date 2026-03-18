'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('discount_code_usage', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      discount_code_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'discount_codes', key: 'id' },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      order_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true, // set when order is placed
        defaultValue: null,
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('discount_code_usage', ['discount_code_id', 'user_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('discount_code_usage');
  },
};
