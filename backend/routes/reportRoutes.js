const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/tasks/excel', verifyToken, reportController.exportTasksExcel);
router.get('/incidents/pdf', verifyToken, reportController.exportIncidentsPDF);

module.exports = router;
