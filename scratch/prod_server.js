require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: ['https://peachpuff-barracuda-735995.hostingersite.com', 'http://localhost:4200'],
  credentials: true
}));
app.use(express.json());

// Database pool
const db = require('./config/db');
console.log('Using MySQL connection pool from config/db.js');

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve Angular frontend (static SPA)
app.use(express.static(path.join(__dirname, 'dist/browser')));

// For all other routes, serve the Angular app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/browser/index.csr.html'));
});

app.listen(PORT, () => {
  console.log(`Koda ERP running on port ${PORT}`);
});
