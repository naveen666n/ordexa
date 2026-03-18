'use strict';

const templates = [
  {
    key: 'order_confirmation',
    value: `<!DOCTYPE html>
<html>
<body>
  <h1>Order Confirmed!</h1>
  <p>Hi {{customer_name}},</p>
  <p>Thank you for your order. Your order <strong>#{{order_number}}</strong> has been confirmed.</p>
  <p><strong>Order Total:</strong> {{order_total}}</p>
  <p><strong>Estimated Delivery:</strong> {{estimated_delivery}}</p>
  <p>We'll notify you when your order ships.</p>
  <p>Thanks,<br>{{store_name}} Team</p>
</body>
</html>`,
  },
  {
    key: 'order_shipped',
    value: `<!DOCTYPE html>
<html>
<body>
  <h1>Your Order Has Shipped!</h1>
  <p>Hi {{customer_name}},</p>
  <p>Great news! Your order <strong>#{{order_number}}</strong> is on its way.</p>
  <p><strong>Tracking Number:</strong> {{tracking_number}}</p>
  <p><strong>Carrier:</strong> {{carrier}}</p>
  <p>Track your order <a href="{{tracking_url}}">here</a>.</p>
  <p>Thanks,<br>{{store_name}} Team</p>
</body>
</html>`,
  },
  {
    key: 'order_delivered',
    value: `<!DOCTYPE html>
<html>
<body>
  <h1>Order Delivered!</h1>
  <p>Hi {{customer_name}},</p>
  <p>Your order <strong>#{{order_number}}</strong> has been delivered successfully.</p>
  <p>We hope you love your purchase! If you have any issues, please contact us at {{support_email}}.</p>
  <p>We'd love to hear your feedback. Please leave a review!</p>
  <p>Thanks,<br>{{store_name}} Team</p>
</body>
</html>`,
  },
  {
    key: 'order_cancelled',
    value: `<!DOCTYPE html>
<html>
<body>
  <h1>Order Cancelled</h1>
  <p>Hi {{customer_name}},</p>
  <p>Your order <strong>#{{order_number}}</strong> has been cancelled.</p>
  <p><strong>Reason:</strong> {{cancellation_reason}}</p>
  <p>If a payment was made, a refund will be processed within 5-7 business days.</p>
  <p>If you have questions, contact us at {{support_email}}.</p>
  <p>Thanks,<br>{{store_name}} Team</p>
</body>
</html>`,
  },
  {
    key: 'password_reset',
    value: `<!DOCTYPE html>
<html>
<body>
  <h1>Reset Your Password</h1>
  <p>Hi {{customer_name}},</p>
  <p>We received a request to reset your password. Click the link below to set a new password:</p>
  <p><a href="{{reset_url}}">Reset Password</a></p>
  <p>This link expires in {{expiry_hours}} hours.</p>
  <p>If you didn't request this, please ignore this email.</p>
  <p>Thanks,<br>{{store_name}} Team</p>
</body>
</html>`,
  },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('cms_content', templates.map((t) => ({
      section: 'email_template',
      key: t.key,
      value: t.value,
      value_type: 'html',
      created_at: now,
      updated_at: now,
    })));
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('cms_content', { section: 'email_template' }, {});
  },
};
