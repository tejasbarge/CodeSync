const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const socketHandler = require('./sockets/socketHandler');
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();

const corsOptions = {
    origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:5173'] : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/ai', aiRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:5173'] : '*',
    methods: ['GET', 'POST']
  }
});

// Initialize Socket Handler
socketHandler(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
