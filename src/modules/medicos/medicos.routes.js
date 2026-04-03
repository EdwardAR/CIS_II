const express = require('express');
const { requireAuth } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { index, create, schedules, addSchedule, doctorPanel } = require('./medicos.controller');
const { doctorValidator, scheduleValidator } = require('./medicos.validators');

const router = express.Router();

router.get('/mi-panel', requireAuth, requireRole('medico'), doctorPanel);

router.get('/', requireAuth, requireRole('admin'), index);
router.post('/', requireAuth, requireRole('admin'), doctorValidator, create);
router.get('/:doctorId/horarios', requireAuth, requireRole('admin'), schedules);
router.post('/:doctorId/horarios', requireAuth, requireRole('admin'), scheduleValidator, addSchedule);

module.exports = router;