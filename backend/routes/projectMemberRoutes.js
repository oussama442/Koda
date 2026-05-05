const express = require('express');
const router = express.Router();
const controller = require('../controllers/projectMemberController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/:project_id', verifyToken, controller.getMembers);
router.post('/', verifyToken, controller.addMember);
router.delete('/:project_id/:user_id', verifyToken, controller.removeMember);

module.exports = router;
