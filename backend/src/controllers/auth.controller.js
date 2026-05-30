const authService = require('../services/auth.service');

function sendError(res, err) {
  const status = err.statusCode || 500;
  res.status(status).json({ error: err.message });
}

async function signup(req, res) {
  try {
    const { userId, password, displayName } = req.body;
    const result = await authService.signup({ userId, password, displayName });
    res.status(201).json(result);
  } catch (err) {
    sendError(res, err);
  }
}

async function login(req, res) {
  try {
    const { userId, password } = req.body;
    const result = await authService.login({ userId, password });
    res.json(result);
  } catch (err) {
    sendError(res, err);
  }
}

async function me(req, res) {
  try {
    const user = await authService.getUserById(req.auth.userId);
    res.json({ user });
  } catch (err) {
    sendError(res, err);
  }
}

module.exports = { signup, login, me };
