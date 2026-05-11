const express = require('express');
const router = express.Router();
const controller = require('../controllers/incidentController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, controller.getAll);
router.get('/:id', verifyToken, controller.getById);
router.post('/', verifyToken, controller.create);
router.put('/:id', verifyToken, controller.update);
router.delete('/:id', verifyToken, controller.remove);

<<<<<<< HEAD
=======
router.get('/:id/corrective-actions', verifyToken, controller.getCorrectiveActions);
router.post('/:id/corrective-actions', verifyToken, controller.addCorrectiveAction);

>>>>>>> 11e8399 (feat: upload latest version of Koda ERP with full module integration and glassmorphism UI)
module.exports = router;
