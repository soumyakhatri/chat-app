const mongoose = require('mongoose');
const env = require('../config/env');

async function connectDB() {
  await mongoose.connect(env.mongoUri);
  console.log('MongoDB connected');
}

module.exports = connectDB;
