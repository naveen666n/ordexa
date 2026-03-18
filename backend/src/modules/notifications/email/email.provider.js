'use strict';
// Interface documentation only — actual implementation in smtp.provider.js
// send(to: string, subject: string, html: string): Promise<void>
const smtp = require('./smtp.provider');
module.exports = smtp;
