'use strict';

const router = require('express').Router();
const authenticate = require('../../middleware/authenticate');
const controller = require('./wishlist.controller');

// All wishlist routes require authentication
router.use(authenticate);

router.get('/', controller.getWishlist);
router.post('/', controller.addToWishlist);
router.delete('/:variantId', controller.removeFromWishlist);

module.exports = router;
