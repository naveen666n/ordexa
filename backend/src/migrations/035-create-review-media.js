'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('review_media', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      review_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'reviews', key: 'id' },
        onDelete: 'CASCADE',
      },
      url: { type: Sequelize.STRING(500), allowNull: false },
      media_type: {
        type: Sequelize.ENUM('image', 'video'),
        allowNull: false,
        defaultValue: 'image',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('review_media');
  },
};
