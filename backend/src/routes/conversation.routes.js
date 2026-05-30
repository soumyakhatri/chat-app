const express = require('express');
const conversationController = require('../controllers/conversation.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/conversations', authenticate, conversationController.list);
router.post(
  '/conversations/:conversationId/read',
  authenticate,
  conversationController.markRead
);

module.exports = router;
