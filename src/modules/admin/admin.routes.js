const express = require('express');
const { requireAuth } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { dashboard, ratings } = require('./admin.controller');

const router = express.Router();

router.get('/',               requireAuth, requireRole('admin'), dashboard);
router.get('/calificaciones', requireAuth, requireRole('admin'), ratings);

module.exports = router;
