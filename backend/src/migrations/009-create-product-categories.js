'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_categories', {
      product_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      category_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'categories', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
    });

    await queryInterface.addConstraint('product_categories', {
      fields: ['product_id', 'category_id'],
      type: 'primary key',
      name: 'pk_product_categories',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_categories');
  },
};
