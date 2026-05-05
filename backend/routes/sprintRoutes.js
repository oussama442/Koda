const express = require('express');
const router = express.Router();
const sprintController = require('../controllers/sprintController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, sprintController.getAll);
router.get('/:id', verifyToken, sprintController.getById);
router.post('/', verifyToken, sprintController.create);
router.put('/:id', verifyToken, sprintController.update);
router.delete('/:id', verifyToken, sprintController.remove);

module.exports = router;
