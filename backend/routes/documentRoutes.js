const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const documentController = require('../controllers/documentController');
const { verifyToken } = require('../middleware/authMiddleware');

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.post('/upload', verifyToken, upload.single('file'), documentController.uploadDocument);
router.get('/:type/:id', verifyToken, documentController.getDocumentsByType);
router.get('/project/:projectId', verifyToken, documentController.getProjectDocuments); // Keep for backwards compatibility if needed
router.delete('/:id', verifyToken, documentController.deleteDocument);

module.exports = router;
