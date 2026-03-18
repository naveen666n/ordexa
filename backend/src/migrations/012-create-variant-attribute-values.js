'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('variant_attribute_values', {
      variant_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'product_variants', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      attribute_value_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'attribute_values', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
    });

    await queryInterface.addConstraint('variant_attribute_values', {
      fields: ['variant_id', 'attribute_value_id'],
      type: 'primary key',
      name: 'pk_variant_attribute_values',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('variant_attribute_values');
  },
};
