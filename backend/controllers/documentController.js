const db = require('../config/db');
const path = require('path');
const fs = require('fs');

function invalidInput(message) {
    return Object.assign(new Error(message), { status: 400 });
}

function parentId(value, field) {
    if (value === undefined || value === null || value === '') return null;
    if (!['string', 'number'].includes(typeof value) || !/^[0-9]+$/.test(String(value))) {
        throw invalidInput(`${field} must be a positive integer`);
    }
    const id = Number(value);
    if (!Number.isInteger(id) || id < 1 || id > 2147483647) {
        throw invalidInput(`${field} must be a positive integer`);
    }
    return id;
}

async function validateImprovementParents(parents) {
    if (!parents.improvement_id) return;
    // Validate improvement attachments against active improvement requests.
    const [requests] = await db.query(
        'SELECT application_id FROM improvement_requests WHERE id = ? AND deleted_at IS NULL',
        [parents.improvement_id]
    );
    if (!requests.length) throw invalidInput('Improvement request not found');
    const parentQueries = {
        project_id: 'SELECT application_id FROM projects WHERE id = ? AND deleted_at IS NULL',
        task_id: 'SELECT p.application_id FROM tasks t JOIN projects p ON t.project_id = p.id WHERE t.id = ? AND t.deleted_at IS NULL AND p.deleted_at IS NULL',
        incident_id: 'SELECT application_id FROM incidents WHERE id = ? AND deleted_at IS NULL'
    };
    for (const [field, sql] of Object.entries(parentQueries)) {
        if (parents[field] === null) continue;
        const [rows] = await db.query(sql, [parents[field]]);
        if (!rows.length || rows[0].application_id !== requests[0].application_id) {
            throw invalidInput('Choose a project, task or incident belonging to the improvement application');
        }
    }
}

async function removeStagedUpload(file) {
    if (!file) return;
    try {
        await fs.promises.unlink(file.path || path.join(__dirname, '../uploads', file.filename));
    } catch (error) {
        if (error.code !== 'ENOENT') console.error('Unable to clean up rejected document:', error.code);
    }
}

exports.uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const parents = {};
        for (const field of ['project_id', 'task_id', 'incident_id', 'improvement_id']) {
            parents[field] = parentId(req.body?.[field], field);
        }
        if (!parents.project_id && !parents.task_id && !parents.incident_id) {
            throw invalidInput('A project, task or incident is required. For an improvement, select a related project.');
        }
        await validateImprovementParents(parents);
        const { filename, mimetype, size } = req.file;
        const user_id = req.user.id;
        // Office MIME strings can exceed the live VARCHAR(50); preserve the file extension instead.
        const extension = path.extname(req.file.originalname).slice(1).toLowerCase();
        const fileFormat = mimetype.length <= 50 ? mimetype : (extension.length <= 50 && extension ? extension : 'application/octet-stream');

        const [result] = await db.query(
            'INSERT INTO documents (project_id, task_id, incident_id, improvement_id, user_id, file_name, storage_path, file_format, file_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [parents.project_id, parents.task_id, parents.incident_id, parents.improvement_id, user_id, req.file.originalname, filename, fileFormat, size]
        );

        res.status(201).json({
            id: result.insertId,
            message: 'Document uploaded successfully',
            document: {
                file_name: req.file.originalname,
                storage_path: filename,
                file_format: fileFormat
            }
        });
    } catch (error) {
        await removeStagedUpload(req.file);
        if (error.status === 400) return res.status(400).json({ message: error.message });
        if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.errno === 4025) {
            return res.status(400).json({ message: 'A valid project, task or incident is required' });
        }
        if (error.code === 'ER_DATA_TOO_LONG') {
            return res.status(400).json({ message: 'The document name or metadata is too long' });
        }
        console.error('Document upload failed:', error.code || error.message);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getDocumentsByType = async (req, res) => {
    try {
        const { type, id } = req.params;
        let column = '';
        if (type === 'projects') column = 'project_id';
        else if (type === 'tasks') column = 'task_id';
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
