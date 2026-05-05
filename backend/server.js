const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Disable caching for API responses (solves Angular withFetch aggressive caching)
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
});

// MySQL Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL database as id ' + db.threadId);
});

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

app.get('/', (req, res) => {
    res.send('Koda API is running and connected to DB!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});