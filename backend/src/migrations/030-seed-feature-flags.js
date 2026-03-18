'use strict';

const flags = [
  { key: 'reviews_enabled', enabled: true, description: 'Allow customers to leave product reviews' },
  { key: 'wishlist_enabled', enabled: true, description: 'Enable wishlist functionality' },
  { key: 'google_auth_enabled', enabled: true, description: 'Allow Google OAuth login' },
  { key: 'cod_enabled', enabled: false, description: 'Cash on delivery payment option' },
  { key: 'coupon_enabled', enabled: true, description: 'Allow discount coupon codes' },
  { key: 'global_offer_enabled', enabled: true, description: 'Enable global product offers' },
  { key: 'sms_notifications_enabled', enabled: false, description: 'Send order SMS notifications' },
  { key: 'email_notifications_enabled', enabled: true, description: 'Send order email notifications' },
  { key: 'product_search_enabled', enabled: true, description: 'Enable product search' },
  { key: 'inventory_blocking_enabled', enabled: true, description: 'Block purchases when out of stock' },
  { key: 'review_media_enabled', enabled: true, description: 'Allow image/video attachments in reviews' },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('feature_flags', flags.map((f) => ({
      ...f,
      created_at: now,
      updated_at: now,
    })));
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('feature_flags', null, {});
  },
};
