'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true, allowNull: false },
      name: { type: Sequelize.STRING(255), allowNull: false },
      slug: { type: Sequelize.STRING(300), allowNull: false, unique: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      brand: { type: Sequelize.STRING(100), allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      is_featured: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      meta_title: { type: Sequelize.STRING(255), allowNull: true },
      meta_description: { type: Sequelize.STRING(500), allowNull: true },
      sort_order: { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    // FULLTEXT index for search
    await queryInterface.sequelize.query(
      'ALTER TABLE products ADD FULLTEXT INDEX ft_products (name, description, brand)'
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('products');
  },
};
