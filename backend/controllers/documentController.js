const db = require('../config/db');
const path = require('path');
const fs = require('fs');

exports.uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { project_id, task_id, incident_id, improvement_id } = req.body;
        const { filename, mimetype, size } = req.file;
        const user_id = req.user.id;

        const [result] = await db.query(
            'INSERT INTO documents (project_id, task_id, incident_id, improvement_id, user_id, file_name, storage_path, file_format, file_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [project_id || null, task_id || null, incident_id || null, improvement_id || null, user_id, req.file.originalname, filename, mimetype, size]
        );

        res.status(201).json({
            id: result.insertId,
            message: 'Document uploaded successfully',
            document: {
                file_name: req.file.originalname,
                storage_path: filename,
                file_format: mimetype
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getDocumentsByType = async (req, res) => {
    try {
        const { type, id } = req.params;
        let column = '';
        if (type === 'projects') column = 'project_id';
        else if (type === 'incidents') column = 'incident_id';
        else if (type === 'improvements') column = 'improvement_id';
        else return res.status(400).json({ message: 'Invalid type' });

        const [rows] = await db.query(
            `SELECT d.*, d.file_name as name, d.file_format as file_type, u.full_name as user_name 
             FROM documents d 
             LEFT JOIN users u ON d.user_id = u.id 
             WHERE d.${column} = ? 
             ORDER BY d.created_at DESC`,
            [id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getProjectDocuments = async (req, res) => {
    try {
        const { projectId } = req.params;
        const [rows] = await db.query(
            `SELECT d.*, u.full_name as user_name 
             FROM documents d 
             LEFT JOIN users u ON d.user_id = u.id 
             WHERE d.project_id = ? 
             ORDER BY d.created_at DESC`,
            [projectId]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT storage_path FROM documents WHERE id = ?', [id]);
        
        if (rows.length === 0) return res.status(404).json({ message: 'Document not found' });

        const filePath = path.join(__dirname, '../uploads', rows[0].storage_path);
        
        // Remove from DB
        await db.query('DELETE FROM documents WHERE id = ?', [id]);

        // Remove from Disk
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
