const express = require('express');
const { requireAuth } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { index, searchSlots, create, complete, cancel, editStatus, requestReschedule, approveReschedule, rate } = require('./citas.controller');
const { createAppointmentValidator, editAppointmentStatusValidator, rateAppointmentValidator } = require('./citas.validators');

const router = express.Router();

router.get('/', requireAuth, index);
router.get('/disponibilidad', requireAuth, requireRole('paciente', 'admin'), searchSlots);
router.post('/', requireAuth, requireRole('paciente'), createAppointmentValidator, create);
router.post('/:id/completar', requireAuth, requireRole('admin', 'medico'), complete);
router.post('/:id/cancelar', requireAuth, requireRole('admin', 'medico', 'paciente'), cancel);
router.post('/:id/editar', requireAuth, requireRole('admin', 'medico'), editAppointmentStatusValidator, editStatus);
router.post('/:id/solicitar-reprogramacion', requireAuth, requireRole('paciente'), requestReschedule);
router.post('/:id/aprobar-reprogramacion', requireAuth, requireRole('admin', 'medico'), approveReschedule);
router.post('/:id/calificar', requireAuth, requireRole('paciente'), rateAppointmentValidator, rate);

module.exports = router;