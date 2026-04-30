const express = require('express');
const router = express.Router();
const controller = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/overview', verifyToken, controller.getOverview);

module.exports = router;
