const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/auth/signup', authController.signup);
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticate, authController.me);

module.exports = router;
