'use strict';

const emailProvider = require('./email/email.provider');
const smsProvider = require('./sms/sms.provider');
const templateRenderer = require('./template.renderer');
const NotificationLog = require('../../models/NotificationLog');
const FeatureFlag = require('../../models/FeatureFlag');

const isEnabled = async (flagKey) => {
  const flag = await FeatureFlag.findOne({ where: { key: flagKey } });
  return flag ? flag.enabled : false;
};

const logNotification = async (type, recipient, subject, templateKey, status, errorMessage = null) => {
  try {
    await NotificationLog.create({ type, recipient, subject, template_key: templateKey, status, error_message: errorMessage });
  } catch (err) {
    // Log persistence failure should not propagate
  }
};

const sendEmail = async (to, templateKey, variables) => {
  if (!await isEnabled('email_notifications_enabled')) return;
  let subject = templateKey;
  try {
    const rendered = await templateRenderer.render(templateKey, variables);
    subject = rendered.subject;
    await emailProvider.send(to, rendered.subject, rendered.html);
    await logNotification('email', to, rendered.subject, templateKey, 'sent');
  } catch (err) {
    await logNotification('email', to, subject, templateKey, 'failed', err.message);
    // Do NOT re-throw — notification failure must not break order flow
  }
};

const sendSMS = async (to, templateKey, variables) => {
  if (!await isEnabled('sms_notifications_enabled')) return;
  if (!to) return;
  try {
    const message = `Order update: ${variables.order_number || ''} - ${variables.status || templateKey}`;
    await smsProvider.send(to, message);
    await logNotification('sms', to, null, templateKey, 'sent');
  } catch (err) {
    await logNotification('sms', to, null, templateKey, 'failed', err.message);
  }
};

/**
 * Build order variables for template rendering.
 */
const buildOrderVars = (order, user) => ({
  customer_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : (order.user ? `${order.user.first_name} ${order.user.last_name}` : 'Customer'),
  order_number: order.order_number,
  order_total: order.total_amount,
  order_status: order.status,
  order_date: order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN') : '',
  delivery_address: order.address_snapshot
    ? `${order.address_snapshot.address_line1}, ${order.address_snapshot.city}, ${order.address_snapshot.state} ${order.address_snapshot.postal_code}`
    : '',
});

const sendOrderConfirmation = async (order, user) => {
  const email = user?.email || order.user?.email;
  const phone = user?.phone || order.user?.phone;
  const vars = buildOrderVars(order, user);
  if (email) await sendEmail(email, 'order_confirmation', vars);
  if (phone) await sendSMS(phone, 'order_confirmation', vars);
};

const sendOrderStatusUpdate = async (order, user, newStatus) => {
  const email = user?.email || order.user?.email;
  const phone = user?.phone || order.user?.phone;
  const templateKey = `order_${newStatus}`;
  const vars = { ...buildOrderVars(order, user), status: newStatus, tracking_note: order.lastNote || '' };
  if (email) await sendEmail(email, templateKey, vars);
  if (phone) await sendSMS(phone, templateKey, vars);
};

const sendPasswordReset = async (user, resetToken) => {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  await sendEmail(user.email, 'password_reset', {
    customer_name: `${user.first_name} ${user.last_name}`.trim(),
    reset_link: resetLink,
  });
};

const sendWelcomeEmail = async (user) => {
  await sendEmail(user.email, 'welcome', {
    customer_name: `${user.first_name} ${user.last_name}`.trim(),
  });
};

module.exports = { sendOrderConfirmation, sendOrderStatusUpdate, sendPasswordReset, sendWelcomeEmail };
