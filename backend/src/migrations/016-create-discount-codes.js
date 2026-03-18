'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('discount_codes', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      code: {
        type: Sequelize.STRING(60),
        allowNull: false,
        unique: true,
      },
      offer_type: {
        type: Sequelize.ENUM('PERCENT', 'FIXED', 'FREE_SHIPPING'),
        allowNull: false,
      },
      discount_value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
      },
      min_order_value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
      },
      max_uses: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null, // null = unlimited
      },
      per_user_limit: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
      },
      current_uses: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      starts_at: { type: Sequelize.DATE, allowNull: true },
      ends_at: { type: Sequelize.DATE, allowNull: true },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('discount_codes', ['code']);
    await queryInterface.addIndex('discount_codes', ['is_active']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('discount_codes');
  },
};
