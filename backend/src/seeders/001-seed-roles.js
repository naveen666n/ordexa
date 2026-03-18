'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('roles', [
      {
        name: 'admin',
        description: 'Full platform administrator',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'customer',
        description: 'End customer who browses and orders products',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'operations',
        description: 'Operations team member who processes orders',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ], {
      ignoreDuplicates: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('roles', null, {});
  },
};
