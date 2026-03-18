'use strict';

const rows = [
  // home section
  { section: 'home', key: 'hero_title', value: 'Welcome to Our Store', value_type: 'string' },
  { section: 'home', key: 'hero_subtitle', value: 'Discover amazing products at great prices', value_type: 'string' },
  { section: 'home', key: 'hero_cta_text', value: 'Shop Now', value_type: 'string' },
  { section: 'home', key: 'hero_cta_link', value: '/products', value_type: 'string' },
  { section: 'home', key: 'hero_image_url', value: '', value_type: 'string' },
  { section: 'home', key: 'promo_strip_text', value: 'Free shipping on orders above ₹499!', value_type: 'string' },
  { section: 'home', key: 'promo_strip_color', value: '#4F46E5', value_type: 'string' },
  { section: 'home', key: 'banner1_image_url', value: '', value_type: 'string' },
  { section: 'home', key: 'banner1_link', value: '', value_type: 'string' },
  { section: 'home', key: 'banner2_image_url', value: '', value_type: 'string' },
  { section: 'home', key: 'banner2_link', value: '', value_type: 'string' },
  // content section
  { section: 'content', key: 'footer_text', value: '© 2025 Store. All rights reserved.', value_type: 'string' },
  { section: 'content', key: 'login_tagline', value: 'Welcome back! Sign in to your account.', value_type: 'string' },
  { section: 'content', key: 'register_tagline', value: 'Create an account and start shopping today!', value_type: 'string' },
  { section: 'content', key: 'empty_cart_message', value: 'Your cart is empty. Start shopping!', value_type: 'string' },
  { section: 'content', key: 'empty_orders_message', value: 'You have no orders yet. Place your first order!', value_type: 'string' },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('cms_content', rows.map((r) => ({
      ...r,
      created_at: now,
      updated_at: now,
    })));
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('cms_content', null, {});
  },
};
