'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reviews', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      product_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      rating: {
        type: Sequelize.TINYINT.UNSIGNED,
        allowNull: false,
      },
      title: { type: Sequelize.STRING(255), allowNull: true },
      body: { type: Sequelize.TEXT, allowNull: true },
      is_approved: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addConstraint('reviews', {
      fields: ['product_id', 'user_id'],
      type: 'unique',
      name: 'reviews_product_user_unique',
    });

    await queryInterface.addConstraint('reviews', {
      fields: ['rating'],
      type: 'check',
      name: 'reviews_rating_check',
      where: { rating: { [Sequelize.Op.between]: [1, 5] } },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('reviews');
  },
};
