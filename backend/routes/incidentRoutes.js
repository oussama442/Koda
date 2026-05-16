const express = require('express');
const router = express.Router();
const controller = require('../controllers/incidentController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, controller.getAll);
router.get('/:id', verifyToken, controller.getById);
router.post('/', verifyToken, controller.create);
router.put('/:id', verifyToken, controller.update);
router.delete('/:id', verifyToken, controller.remove);

router.get('/:id/corrective-actions', verifyToken, controller.getCorrectiveActions);
router.post('/:id/corrective-actions', verifyToken, controller.addCorrectiveAction);
module.exports = router;
