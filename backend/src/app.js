const path = require('path');
const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const conversationRoutes = require('./routes/conversation.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Serve static files from the public directory for socket.io test
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api', healthRoutes);
app.use('/api', authRoutes);
app.use('/api', conversationRoutes);

module.exports = app;
