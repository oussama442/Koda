const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
<<<<<<< HEAD
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.use(verifyToken, isAdmin);
=======
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);
>>>>>>> 11e8399 (feat: upload latest version of Koda ERP with full module integration and glassmorphism UI)

router.get('/', roleController.getAllRoles);
router.get('/permissions', roleController.getAllPermissions);
router.get('/:id', roleController.getRoleById);
router.post('/', roleController.createRole);
router.put('/:id', roleController.updateRole);
router.delete('/:id', roleController.deleteRole);

module.exports = router;
