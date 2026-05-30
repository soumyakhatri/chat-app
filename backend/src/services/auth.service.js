const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const env = require('../config/env');

const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 4;
const MIN_USER_ID_LENGTH = 3;

function formatPublicUser(user) {
  return {
    userId: user.userId,
    displayName: user.displayName,
  };
}

function signToken(user) {
  return jwt.sign(
    { userId: user.userId, displayName: user.displayName },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

function validateCredentials(userId, password) {
  const trimmedId = typeof userId === 'string' ? userId.trim() : '';
  const trimmedPassword = typeof password === 'string' ? password : '';

  if (!trimmedId || trimmedId.length < MIN_USER_ID_LENGTH) {
    const err = new Error(`User ID must be at least ${MIN_USER_ID_LENGTH} characters`);
    err.statusCode = 400;
    throw err;
  }

  if (!trimmedPassword || trimmedPassword.length < MIN_PASSWORD_LENGTH) {
    const err = new Error(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
    );
    err.statusCode = 400;
    throw err;
  }

  return { userId: trimmedId, password: trimmedPassword };
}

async function signup({ userId, password, displayName }) {
  const { userId: trimmedId, password: trimmedPassword } = validateCredentials(
    userId,
    password
  );

  const existing = await User.findOne({ userId: trimmedId }).select('+passwordHash');
  if (existing) {
    const err = new Error('User ID is already taken');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(trimmedPassword, SALT_ROUNDS);
  const name =
    typeof displayName === 'string' && displayName.trim()
      ? displayName.trim()
      : trimmedId;

  const user = await User.create({
    userId: trimmedId,
    displayName: name,
    passwordHash,
  });

  const token = signToken(user);
  return { user: formatPublicUser(user), token };
}

async function login({ userId, password }) {
  const { userId: trimmedId, password: trimmedPassword } = validateCredentials(
    userId,
    password
  );

  const user = await User.findOne({ userId: trimmedId }).select('+passwordHash');
  if (!user || !user.passwordHash) {
    const err = new Error('Invalid user ID or password');
    err.statusCode = 401;
    throw err;
  }

  const valid = await bcrypt.compare(trimmedPassword, user.passwordHash);
  if (!valid) {
    const err = new Error('Invalid user ID or password');
    err.statusCode = 401;
    throw err;
  }

  const token = signToken(user);
  return { user: formatPublicUser(user), token };
}

async function getUserById(userId) {
  const user = await User.findOne({ userId });
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return formatPublicUser(user);
}

module.exports = {
  signup,
  login,
  getUserById,
  signToken,
};
