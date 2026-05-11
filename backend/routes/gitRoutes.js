const express = require('express');
const router = express.Router();
const gitController = require('../controllers/gitController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/sync', verifyToken, gitController.syncCommits);
router.get('/application/:appId', verifyToken, gitController.getApplicationCommits);
router.get('/branches/:appId', verifyToken, gitController.getBranches);
router.get('/merge-requests/:appId', verifyToken, gitController.getMergeRequests);
router.get('/pipelines/:appId', verifyToken, gitController.getPipelines);

module.exports = router;
