'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    // Get admin role id
    const [roles] = await queryInterface.sequelize.query(
      "SELECT id FROM roles WHERE name = 'admin' LIMIT 1"
    );

    if (!roles.length) {
      throw new Error('Admin role not found — run 001-seed-roles first');
    }

    const roleId = roles[0].id;
    const passwordHash = await bcrypt.hash('Admin@1234', 12);

    // Check if admin already exists
    const [existing] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'admin@example.com' LIMIT 1"
    );

    if (existing.length) {
      console.log('Admin user already exists — skipping seed');
      return;
    }

    await queryInterface.bulkInsert('users', [
      {
        role_id: roleId,
        first_name: 'Platform',
        last_name: 'Admin',
        email: 'admin@example.com',
        password_hash: passwordHash,
        phone: null,
        google_id: null,
        avatar_url: null,
        is_active: true,
        is_email_verified: true,
        registration_completed: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    console.log('✅ Admin user seeded: admin@example.com / Admin@1234');
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { email: 'admin@example.com' });
  },
};
