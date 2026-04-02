const express = require('express');
const { requireGuest, requireAuth } = require('../../middlewares/auth.middleware');
const { showLogin, showRegister, register, login, logout } = require('./auth.controller');
const { registerValidator, loginValidator } = require('./auth.validators');

const router = express.Router();

router.get('/login', requireGuest, showLogin);
router.post('/login', requireGuest, loginValidator, login);
router.get('/register', requireGuest, showRegister);
router.post('/register', requireGuest, registerValidator, register);
router.post('/logout', requireAuth, logout);

module.exports = router;