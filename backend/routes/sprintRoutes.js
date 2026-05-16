const express = require('express');
const router = express.Router();
const sprintController = require('../controllers/sprintController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, sprintController.getAll);
router.get('/:id', verifyToken, sprintController.getById);
router.post('/', verifyToken, sprintController.create);
router.put('/:id', verifyToken, sprintController.update);
router.delete('/:id', verifyToken, sprintController.remove);

// New features
router.get('/:id/checklist', verifyToken, sprintController.getChecklist);
router.put('/:id/checklist', verifyToken, sprintController.updateChecklist);
router.get('/:id/history', verifyToken, sprintController.getHistory);
router.post('/:id/delay', verifyToken, sprintController.delay);
router.post('/:id/close', verifyToken, sprintController.close);

module.exports = router;
