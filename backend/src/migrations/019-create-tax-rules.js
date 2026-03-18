'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tax_rules', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      // Matches by region (state code or country code) — null = any region
      region: {
        type: Sequelize.STRING(10),
        allowNull: true,
        defaultValue: null,
      },
      // Matches by product category slug — null = any category
      category_slug: {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: null,
      },
      // Tax rate as percentage, e.g. 18 = 18%
      rate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
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
    await queryInterface.dropTable('tax_rules');
  },
};
