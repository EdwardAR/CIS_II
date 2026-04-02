const express = require('express');
const { requireAuth } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { index, searchSlots, create, complete, cancel } = require('./citas.controller');
const { createAppointmentValidator } = require('./citas.validators');

const router = express.Router();

router.get('/', requireAuth, index);
router.get('/disponibilidad', requireAuth, requireRole('paciente', 'admin'), searchSlots);
router.post('/', requireAuth, requireRole('paciente'), createAppointmentValidator, create);
router.post('/:id/completar', requireAuth, requireRole('admin', 'medico'), complete);
router.post('/:id/cancelar', requireAuth, requireRole('admin', 'medico', 'paciente'), cancel);

module.exports = router;