const express = require('express');
const { requireAuth } = require('../../middlewares/auth.middleware');
const { read } = require('./notificaciones.controller');

const router = express.Router();

router.post('/:id/leer', requireAuth, read);

module.exports = router;