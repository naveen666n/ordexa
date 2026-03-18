const rateLimit = require('express-rate-limit');

const isDev = process.env.NODE_ENV !== 'production';

const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting in development so automation scripts can run freely
    skip: (req) => isDev && (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1'),
    message: {
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: message || 'Too many requests, please try again later.',
      },
    },
  });

const generalLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  200,
  'Too many requests, please try again later.'
);

const authLimiter = createLimiter(
  15 * 60 * 1000,
  10,
  'Too many login attempts, please try again in 15 minutes.'
);

const adminLimiter = createLimiter(
  15 * 60 * 1000,
  500,
  'Too many requests.'
);

module.exports = { generalLimiter, authLimiter, adminLimiter };
