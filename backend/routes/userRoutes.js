const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/avatars');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `avatar_${req.user.id}_${Date.now()}${ext}`);
    }
});

const upload = multer({ storage });

router.get('/', verifyToken, isAdmin, userController.getUsers);
router.put('/profile', verifyToken, userController.updateProfile);
router.post('/profile/avatar', verifyToken, upload.single('avatar'), userController.uploadAvatar);
router.get('/:id', verifyToken, isAdmin, userController.getUser);
router.post('/', verifyToken, isAdmin, userController.createUser);
router.put('/:id', verifyToken, isAdmin, userController.updateUser);
router.delete('/:id', verifyToken, isAdmin, userController.deleteUser);

module.exports = router;
