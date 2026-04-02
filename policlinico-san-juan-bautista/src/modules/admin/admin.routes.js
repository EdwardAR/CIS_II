const express = require('express');
const { requireAuth } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { dashboard } = require('./admin.controller');

const router = express.Router();

router.get('/', requireAuth, requireRole('admin'), dashboard);

module.exports = router;