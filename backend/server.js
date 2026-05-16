const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Disable caching for API responses (solves Angular withFetch aggressive caching)
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
});

const db = require('./config/db');

// No need for db.connect() with a pool, it connects on demand.
console.log('Using MySQL connection pool from config/db.js');

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/roles', require('./routes/roleRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/incidents', require('./routes/incidentRoutes'));
app.use('/api/deployments', require('./routes/deploymentRoutes'));
app.use('/api/sprints', require('./routes/sprintRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/project-members', require('./routes/projectMemberRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/git', require('./routes/gitRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/improvements', require('./routes/improvementRoutes'));

// Serve uploads statically
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
    res.send('Koda API is running and connected to DB!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});