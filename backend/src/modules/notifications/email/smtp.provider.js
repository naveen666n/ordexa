'use strict';
const nodemailer = require('nodemailer');
const { SiteConfig } = require('../../../models');

// Read actual SMTP config including secrets directly from DB
const getSMTPConfig = async () => {
  const rows = await SiteConfig.findAll({ where: { group: 'notification' } });
  const cfg = {};
  for (const r of rows) cfg[r.key] = r.value;
  return cfg;
};

const send = async (to, subject, html) => {
  const cfg = await getSMTPConfig();
  if (!cfg.smtp_host || !cfg.smtp_user) {
    throw new Error('SMTP not configured');
  }
  const transporter = nodemailer.createTransport({
    host: cfg.smtp_host,
    port: Number(cfg.smtp_port) || 587,
    secure: Number(cfg.smtp_port) === 465,
    auth: { user: cfg.smtp_user, pass: cfg.smtp_pass || '' },
  });
  await transporter.sendMail({
    from: `"${cfg.smtp_from_name || 'Store'}" <${cfg.smtp_from_email || cfg.smtp_user}>`,
    to,
    subject,
    html,
  });
};

module.exports = { send };
