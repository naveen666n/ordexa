const express = require('express');
const router = express.Router();
const passport = require('../../config/passport');
const controller = require('./auth.controller');
const { authLimiter } = require('../../middleware/rateLimiter');
const authenticate = require('../../middleware/authenticate');
const validation = require('./auth.validation');
const env = require('../../config/env');

// Apply auth rate limiter to all auth routes
router.use(authLimiter);

// ─── Validate helper ──────────────────────────────────────────────────────────
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const { validationError } = require('../../utils/response');
    return validationError(res, error.details.map((d) => ({ field: d.context.key, message: d.message })));
  }
  next();
};

// ─── Routes ───────────────────────────────────────────────────────────────────

router.post('/register', validate(validation.register), controller.register);
router.post('/login', validate(validation.login), controller.login);
router.post('/logout', controller.logout);
router.post('/refresh-token', controller.refreshToken);
router.post('/forgot-password', validate(validation.forgotPassword), controller.forgotPassword);
router.post('/reset-password', validate(validation.resetPassword), controller.resetPassword);

// Google OAuth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${env.FRONTEND_URL}/login?error=google_failed`,
  }),
  controller.googleCallback
);

// Complete registration (requires access token)
router.post('/complete-registration', authenticate, validate(validation.completeRegistration), controller.completeRegistration);

module.exports = router;
