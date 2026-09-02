const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const documentController = require('../controllers/documentController');
const { verifyToken } = require('../middleware/authMiddleware');
const uploadsDirectory = path.join(__dirname, '../uploads');

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        fs.mkdir(uploadsDirectory, { recursive: true }, error => cb(error, uploadsDirectory));
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
router.get('/project/:projectId', verifyToken, documentController.getProjectDocuments); // Keep for backwards compatibility if needed
router.get('/:type/:id', verifyToken, documentController.getDocumentsByType);
router.delete('/:id', verifyToken, documentController.deleteDocument);

module.exports = router;
