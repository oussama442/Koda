const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'controllers');
const routesDir = path.join(__dirname, 'routes');

const makeController = (name, table, fields, hasSoftDelete = true) => 
"const mysql = require('mysql2/promise');\n" +
"require('dotenv').config();\n" +
"\n" +
"const db = mysql.createPool({\n" +
"    host: process.env.DB_HOST,\n" +
"    user: process.env.DB_USER,\n" +
"    password: process.env.DB_PASSWORD,\n" +
"    database: process.env.DB_NAME,\n" +
"    waitForConnections: true,\n" +
"    connectionLimit: 10,\n" +
"    queueLimit: 0\n" +
"});\n" +
"\n" +
"exports.getAll = async (req, res) => {\n" +
"    try {\n" +
"        const [rows] = await db.query('SELECT * FROM " + table + (hasSoftDelete ? " WHERE deleted_at IS NULL" : "") + " ORDER BY id DESC');\n" +
"        res.json(rows);\n" +
"    } catch (error) {\n" +
"        res.status(500).json({ message: error.message });\n" +
"    }\n" +
"};\n" +
"\n" +
"exports.getById = async (req, res) => {\n" +
"    try {\n" +
"        const { id } = req.params;\n" +
"        const [rows] = await db.query('SELECT * FROM " + table + " WHERE id = ?" + (hasSoftDelete ? " AND deleted_at IS NULL" : "") + "', [id]);\n" +
"        if (rows.length === 0) return res.status(404).json({ message: 'Not found' });\n" +
"        res.json(rows[0]);\n" +
"    } catch (error) {\n" +
"        res.status(500).json({ message: error.message });\n" +
"    }\n" +
"};\n" +
"\n" +
"exports.create = async (req, res) => {\n" +
"    try {\n" +
"        const { " + fields.join(', ') + " } = req.body;\n" +
"        const [result] = await db.query(\n" +
"            'INSERT INTO " + table + " (" + fields.join(', ') + ") VALUES (" + fields.map(()=>'?').join(', ') + ")',\n" +
"            [" + fields.map(f => `req.body.${f}`).join(', ') + "]\n" +
"        );\n" +
"        res.status(201).json({ id: result.insertId, message: 'Created successfully' });\n" +
"    } catch (error) {\n" +
"        res.status(500).json({ message: error.message });\n" +
"    }\n" +
"};\n" +
"\n" +
"exports.update = async (req, res) => {\n" +
"    try {\n" +
"        const { id } = req.params;\n" +
"        const { " + fields.join(', ') + " } = req.body;\n" +
"        await db.query(\n" +
"            'UPDATE " + table + " SET " + fields.map(f => f + ' = ?').join(', ') + " WHERE id = ?',\n" +
"            [" + fields.map(f => `req.body.${f}`).join(', ') + ", id]\n" +
"        );\n" +
"        res.json({ message: 'Updated successfully' });\n" +
"    } catch (error) {\n" +
"        res.status(500).json({ message: error.message });\n" +
"    }\n" +
"};\n" +
"\n" +
"exports.remove = async (req, res) => {\n" +
"    try {\n" +
"        const { id } = req.params;\n" +
"        " + (hasSoftDelete ? ("await db.query('UPDATE " + table + " SET deleted_at = NOW() WHERE id = ?', [id]);") : ("await db.query('DELETE FROM " + table + " WHERE id = ?', [id]);")) + "\n" +
"        res.json({ message: 'Deleted successfully' });\n" +
"    } catch (error) {\n" +
"        res.status(500).json({ message: error.message });\n" +
"    }\n" +
"};\n";

const makeRoute = (name) => 
"const express = require('express');\n" +
"const router = express.Router();\n" +
"const controller = require('../controllers/" + name + "Controller');\n" +
"const { verifyToken } = require('../middleware/authMiddleware');\n" +
"\n" +
"router.get('/', verifyToken, controller.getAll);\n" +
"router.get('/:id', verifyToken, controller.getById);\n" +
"router.post('/', verifyToken, controller.create);\n" +
"router.put('/:id', verifyToken, controller.update);\n" +
"router.delete('/:id', verifyToken, controller.remove);\n" +
"\n" +
"module.exports = router;\n";

const dashboardController = 
"const mysql = require('mysql2/promise');\n" +
"require('dotenv').config();\n" +
"\n" +
"const db = mysql.createPool({\n" +
"    host: process.env.DB_HOST,\n" +
"    user: process.env.DB_USER,\n" +
"    password: process.env.DB_PASSWORD,\n" +
"    database: process.env.DB_NAME,\n" +
"    waitForConnections: true,\n" +
"    connectionLimit: 10,\n" +
"    queueLimit: 0\n" +
"});\n" +
"\n" +
"exports.getOverview = async (req, res) => {\n" +
"    try {\n" +
"        const [criticalIncidents] = await db.query(\"SELECT COUNT(*) as count FROM incidents WHERE status = 'Critical' AND deleted_at IS NULL\");\n" +
"        const [recentDeployments] = await db.query(\"SELECT * FROM deployments ORDER BY deployed_at DESC LIMIT 5\");\n" +
"        const [appsCount] = await db.query(\"SELECT COUNT(*) as count FROM applications WHERE deleted_at IS NULL\");\n" +
"        const [projectsCount] = await db.query(\"SELECT COUNT(*) as count FROM projects WHERE deleted_at IS NULL\");\n" +
"\n" +
"        res.json({\n" +
"            criticalIncidents: criticalIncidents[0].count,\n" +
"            recentDeployments: recentDeployments,\n" +
"            totalApplications: appsCount[0].count,\n" +
"            totalProjects: projectsCount[0].count\n" +
"        });\n" +
"    } catch (error) {\n" +
"        res.status(500).json({ message: error.message });\n" +
"    }\n" +
"};\n";

const dashboardRoute = 
"const express = require('express');\n" +
"const router = express.Router();\n" +
"const controller = require('../controllers/dashboardController');\n" +
"const { verifyToken } = require('../middleware/authMiddleware');\n" +
"\n" +
"router.get('/overview', verifyToken, controller.getOverview);\n" +
"\n" +
"module.exports = router;\n";

const modules = [
    { name: 'application', table: 'applications', fields: ['name', 'description', 'current_status', 'github_repo_url'], hasSoftDelete: true },
    { name: 'project', table: 'projects', fields: ['application_id', 'name', 'description', 'start_date', 'end_date'], hasSoftDelete: true },
    { name: 'incident', table: 'incidents', fields: ['application_id', 'user_id', 'title', 'description', 'status'], hasSoftDelete: true },
    { name: 'deployment', table: 'deployments', fields: ['application_id', 'version', 'deployed_at', 'pre_deploy_actions', 'post_deploy_actions'], hasSoftDelete: false }
];

fs.writeFileSync(path.join(controllersDir, 'dashboardController.js'), dashboardController);
fs.writeFileSync(path.join(routesDir, 'dashboardRoutes.js'), dashboardRoute);

modules.forEach(m => {
    fs.writeFileSync(path.join(controllersDir, m.name + 'Controller.js'), makeController(m.name, m.table, m.fields, m.hasSoftDelete));
    fs.writeFileSync(path.join(routesDir, m.name + 'Routes.js'), makeRoute(m.name));
});

console.log('Backend mapped securely!');
