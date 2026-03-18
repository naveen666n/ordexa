'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payments', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      order_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onDelete: 'CASCADE',
      },
      gateway: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: 'razorpay',
      },
      gateway_order_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true,
      },
      gateway_payment_id: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      gateway_signature: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: 'INR',
      },
      status: {
        type: Sequelize.ENUM('initiated', 'captured', 'failed', 'refunded', 'partially_refunded'),
        allowNull: false,
        defaultValue: 'initiated',
      },
      payment_method: {
        type: Sequelize.STRING(60),
        allowNull: true,
      },
      failure_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      refund_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      raw_webhook_payload: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('payments', ['order_id']);
    await queryInterface.addIndex('payments', ['gateway_order_id']);
    await queryInterface.addIndex('payments', ['gateway_payment_id']);
    await queryInterface.addIndex('payments', ['status']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('payments');
  },
};
