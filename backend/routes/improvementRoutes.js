const express = require('express');
const router = express.Router();
const improvementController = require('../controllers/improvementController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/', verifyToken, improvementController.createImprovementRequest);
router.get('/', verifyToken, improvementController.getImprovementRequests);
router.patch('/:id/status', verifyToken, improvementController.updateImprovementStatus);

module.exports = router;
