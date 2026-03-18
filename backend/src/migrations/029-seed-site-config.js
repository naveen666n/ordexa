'use strict';

const rows = [
  // site group
  { group: 'site', key: 'name', value: 'Store', value_type: 'string', is_secret: false },
  { group: 'site', key: 'tagline', value: '', value_type: 'string', is_secret: false },
  { group: 'site', key: 'logo_url', value: '', value_type: 'string', is_secret: false },
  { group: 'site', key: 'favicon_url', value: '', value_type: 'string', is_secret: false },
  { group: 'site', key: 'contact_email', value: '', value_type: 'string', is_secret: false },
  { group: 'site', key: 'contact_phone', value: '', value_type: 'string', is_secret: false },
  { group: 'site', key: 'currency', value: 'INR', value_type: 'string', is_secret: false },
  // theme group
  { group: 'theme', key: 'primary_color', value: '#4F46E5', value_type: 'string', is_secret: false },
  { group: 'theme', key: 'secondary_color', value: '#10B981', value_type: 'string', is_secret: false },
  { group: 'theme', key: 'accent_color', value: '#F59E0B', value_type: 'string', is_secret: false },
  { group: 'theme', key: 'font_family', value: 'Inter, system-ui, sans-serif', value_type: 'string', is_secret: false },
  { group: 'theme', key: 'background_color', value: '#FFFFFF', value_type: 'string', is_secret: false },
  { group: 'theme', key: 'text_color', value: '#111827', value_type: 'string', is_secret: false },
  // payment group
  { group: 'payment', key: 'gateway', value: 'mock', value_type: 'string', is_secret: false },
  { group: 'payment', key: 'razorpay_key_id', value: '', value_type: 'string', is_secret: false },
  { group: 'payment', key: 'razorpay_key_secret', value: '', value_type: 'string', is_secret: true },
  { group: 'payment', key: 'razorpay_webhook_secret', value: '', value_type: 'string', is_secret: true },
  { group: 'payment', key: 'currency', value: 'INR', value_type: 'string', is_secret: false },
  // notification group
  { group: 'notification', key: 'smtp_host', value: '', value_type: 'string', is_secret: false },
  { group: 'notification', key: 'smtp_port', value: '587', value_type: 'string', is_secret: false },
  { group: 'notification', key: 'smtp_user', value: '', value_type: 'string', is_secret: false },
  { group: 'notification', key: 'smtp_pass', value: '', value_type: 'string', is_secret: true },
  { group: 'notification', key: 'smtp_from_name', value: '', value_type: 'string', is_secret: false },
  { group: 'notification', key: 'smtp_from_email', value: '', value_type: 'string', is_secret: false },
  { group: 'notification', key: 'sms_provider', value: '', value_type: 'string', is_secret: false },
  { group: 'notification', key: 'sms_api_key', value: '', value_type: 'string', is_secret: true },
  { group: 'notification', key: 'sms_sender_id', value: '', value_type: 'string', is_secret: false },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('site_config', rows.map((r) => ({
      ...r,
      created_at: now,
      updated_at: now,
    })));
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('site_config', null, {});
  },
};
