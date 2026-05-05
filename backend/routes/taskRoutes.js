const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, taskController.getAll);
router.get('/:id', verifyToken, taskController.getById);
router.post('/', verifyToken, taskController.create);
router.put('/:id', verifyToken, taskController.update);
router.delete('/:id', verifyToken, taskController.remove);
router.post('/:id/comments', verifyToken, taskController.addComment);

module.exports = router;
