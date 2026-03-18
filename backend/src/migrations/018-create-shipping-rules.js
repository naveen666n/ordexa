'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('shipping_rules', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      strategy: {
        type: Sequelize.ENUM('flat_rate', 'free'),
        allowNull: false,
        defaultValue: 'flat_rate',
      },
      // JSON config for strategy — e.g. { "amount": 50, "free_above": 999 }
      config: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('shipping_rules');
  },
};
