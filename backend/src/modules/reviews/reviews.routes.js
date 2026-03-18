'use strict';

const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');
const controller = require('./reviews.controller');

// Optional authenticate — sets req.user if token is valid, but never blocks the request
const { verifyAccessToken } = require('../../utils/jwt');
const { User, Role } = require('../../models');

const optionalAuthenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const user = await User.findOne({
      where: { id: decoded.id, is_active: true },
      include: [{ model: Role, as: 'role' }],
    });
    if (user) req.user = user;
  } catch {
    // Token invalid or expired — proceed without user
  }
  next();
};

// Multer array middleware for review media (up to 5 files)
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const mediaStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(process.cwd(), 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const mediaFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WebP, and MP4 files are allowed'), false);
  }
};

const uploadMediaArray = multer({
  storage: mediaStorage,
  fileFilter: mediaFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).array('media', 5);

// ─── Public routes ────────────────────────────────────────────────────────────
// GET /products/:slug/reviews — public but enriched with can_review if authenticated
router.get('/products/:slug/reviews', optionalAuthenticate, controller.getProductReviews);

// ─── Customer routes ──────────────────────────────────────────────────────────
// POST /products/:slug/reviews — must be authenticated customer
router.post('/products/:slug/reviews', authenticate, uploadMediaArray, controller.createReview);

// ─── Admin routes ─────────────────────────────────────────────────────────────
router.get('/admin/reviews', authenticate, requireRole('admin'), controller.listPendingReviews);
router.patch('/admin/reviews/:id/approve', authenticate, requireRole('admin'), controller.approveReview);
router.delete('/admin/reviews/:id', authenticate, requireRole('admin'), controller.deleteReview);

module.exports = router;
