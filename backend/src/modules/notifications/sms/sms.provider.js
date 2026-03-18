'use strict';

const send = async (to, message) => {
  // No concrete SMS provider configured yet — log only
  console.info(`[SMS stub] To: ${to} | Message: ${message}`);
};

module.exports = { send };
