'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // Top-level categories
    await queryInterface.bulkInsert('categories', [
      { name: 'Electronics', slug: 'electronics', parent_id: null, sort_order: 1, is_active: true, created_at: now, updated_at: now },
      { name: 'Clothing', slug: 'clothing', parent_id: null, sort_order: 2, is_active: true, created_at: now, updated_at: now },
      { name: 'Home & Kitchen', slug: 'home-kitchen', parent_id: null, sort_order: 3, is_active: true, created_at: now, updated_at: now },
    ]);

    const [electronics] = await queryInterface.sequelize.query(
      `SELECT id FROM categories WHERE slug = 'electronics' LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const [clothing] = await queryInterface.sequelize.query(
      `SELECT id FROM categories WHERE slug = 'clothing' LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const [homeKitchen] = await queryInterface.sequelize.query(
      `SELECT id FROM categories WHERE slug = 'home-kitchen' LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Sub-categories
    await queryInterface.bulkInsert('categories', [
      // Electronics
      { name: 'Phones', slug: 'phones', parent_id: electronics.id, sort_order: 1, is_active: true, created_at: now, updated_at: now },
      { name: 'Laptops', slug: 'laptops', parent_id: electronics.id, sort_order: 2, is_active: true, created_at: now, updated_at: now },
      { name: 'Accessories', slug: 'electronics-accessories', parent_id: electronics.id, sort_order: 3, is_active: true, created_at: now, updated_at: now },
      // Clothing
      { name: "Men's", slug: 'mens', parent_id: clothing.id, sort_order: 1, is_active: true, created_at: now, updated_at: now },
      { name: "Women's", slug: 'womens', parent_id: clothing.id, sort_order: 2, is_active: true, created_at: now, updated_at: now },
      { name: 'Kids', slug: 'kids', parent_id: clothing.id, sort_order: 3, is_active: true, created_at: now, updated_at: now },
      // Home & Kitchen
      { name: 'Cookware', slug: 'cookware', parent_id: homeKitchen.id, sort_order: 1, is_active: true, created_at: now, updated_at: now },
      { name: 'Furniture', slug: 'furniture', parent_id: homeKitchen.id, sort_order: 2, is_active: true, created_at: now, updated_at: now },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('categories', null, {});
  },
};
