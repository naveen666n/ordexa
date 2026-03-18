'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('attributes', [
      { name: 'Color', slug: 'color', type: 'select', is_filterable: true, is_visible: true, sort_order: 1, created_at: now, updated_at: now },
      { name: 'Size', slug: 'size', type: 'select', is_filterable: true, is_visible: true, sort_order: 2, created_at: now, updated_at: now },
      { name: 'Material', slug: 'material', type: 'select', is_filterable: false, is_visible: true, sort_order: 3, created_at: now, updated_at: now },
    ]);

    const [color] = await queryInterface.sequelize.query(
      `SELECT id FROM attributes WHERE slug = 'color' LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const [size] = await queryInterface.sequelize.query(
      `SELECT id FROM attributes WHERE slug = 'size' LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const [material] = await queryInterface.sequelize.query(
      `SELECT id FROM attributes WHERE slug = 'material' LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    await queryInterface.bulkInsert('attribute_values', [
      // Color values
      { attribute_id: color.id, value: 'Red', slug: 'red', color_hex: '#FF0000', sort_order: 1, created_at: now, updated_at: now },
      { attribute_id: color.id, value: 'Blue', slug: 'blue', color_hex: '#0000FF', sort_order: 2, created_at: now, updated_at: now },
      { attribute_id: color.id, value: 'Green', slug: 'green', color_hex: '#008000', sort_order: 3, created_at: now, updated_at: now },
      { attribute_id: color.id, value: 'Black', slug: 'black', color_hex: '#000000', sort_order: 4, created_at: now, updated_at: now },
      { attribute_id: color.id, value: 'White', slug: 'white', color_hex: '#FFFFFF', sort_order: 5, created_at: now, updated_at: now },
      // Size values
      { attribute_id: size.id, value: 'XS', slug: 'xs', color_hex: null, sort_order: 1, created_at: now, updated_at: now },
      { attribute_id: size.id, value: 'S', slug: 's', color_hex: null, sort_order: 2, created_at: now, updated_at: now },
      { attribute_id: size.id, value: 'M', slug: 'm', color_hex: null, sort_order: 3, created_at: now, updated_at: now },
      { attribute_id: size.id, value: 'L', slug: 'l', color_hex: null, sort_order: 4, created_at: now, updated_at: now },
      { attribute_id: size.id, value: 'XL', slug: 'xl', color_hex: null, sort_order: 5, created_at: now, updated_at: now },
      { attribute_id: size.id, value: 'XXL', slug: 'xxl', color_hex: null, sort_order: 6, created_at: now, updated_at: now },
      // Material values
      { attribute_id: material.id, value: 'Cotton', slug: 'cotton', color_hex: null, sort_order: 1, created_at: now, updated_at: now },
      { attribute_id: material.id, value: 'Polyester', slug: 'polyester', color_hex: null, sort_order: 2, created_at: now, updated_at: now },
      { attribute_id: material.id, value: 'Leather', slug: 'leather', color_hex: null, sort_order: 3, created_at: now, updated_at: now },
      { attribute_id: material.id, value: 'Wool', slug: 'wool', color_hex: null, sort_order: 4, created_at: now, updated_at: now },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('attribute_values', null, {});
    await queryInterface.bulkDelete('attributes', null, {});
  },
};
