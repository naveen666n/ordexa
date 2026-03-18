'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('global_offers', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      offer_type: {
        type: Sequelize.ENUM('PERCENT', 'FIXED', 'FREE_SHIPPING', 'BXGY'),
        allowNull: false,
      },
      discount_value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
      },
      buy_quantity: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null,
      },
      get_quantity: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null,
      },
      min_order_value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
      },
      starts_at: { type: Sequelize.DATE, allowNull: true },
      ends_at: { type: Sequelize.DATE, allowNull: true },
      // Precedence strategy: which offer wins when both product and global offers exist
      precedence: {
        type: Sequelize.ENUM('global_wins', 'product_wins', 'best_deal'),
        allowNull: false,
        defaultValue: 'best_deal',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('global_offers');
  },
};
