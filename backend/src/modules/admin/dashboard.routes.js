'use strict';

const express = require('express');
const router = express.Router();
const { getStats } = require('./dashboard.controller');
const authenticate = require('../../middleware/authenticate');
const requireRole = require('../../middleware/requireRole');

router.get('/dashboard', authenticate, requireRole('admin'), getStats);

module.exports = router;
