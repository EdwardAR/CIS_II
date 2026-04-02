const express = require('express');
const { requireAuth } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { profile, updateProfile } = require('./pacientes.controller');
const { updateProfileValidator } = require('./pacientes.validators');

const router = express.Router();

router.get('/perfil', requireAuth, requireRole('paciente'), profile);
router.post('/perfil', requireAuth, requireRole('paciente'), updateProfileValidator, updateProfile);

module.exports = router;