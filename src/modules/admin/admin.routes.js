const express = require('express');
const { requireAuth } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { dashboard, ratings, auditLogs } = require('./admin.controller');

const router = express.Router();

router.get('/',               requireAuth, requireRole('admin'), dashboard);
router.get('/calificaciones', requireAuth, requireRole('admin'), ratings);
router.get('/auditoria',      requireAuth, requireRole('admin'), auditLogs);

module.exports = router;
