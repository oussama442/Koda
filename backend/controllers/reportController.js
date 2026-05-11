const db = require('../config/db');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

exports.exportTasksExcel = async (req, res) => {
    try {
        const [tasks] = await db.query(`
            SELECT t.id, t.title, t.status, t.story_points, p.name as project_name, u.username as assigned_to
            FROM tasks t
            LEFT JOIN projects p ON t.project_id = p.id
            LEFT JOIN users u ON t.user_id = u.id
            WHERE t.deleted_at IS NULL
        `);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Tasks');

        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Title', key: 'title', width: 30 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Story Points', key: 'story_points', width: 15 },
            { header: 'Project', key: 'project_name', width: 25 },
            { header: 'Assigned To', key: 'assigned_to', width: 20 }
        ];

        worksheet.addRows(tasks);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=tasks_report.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error exporting tasks to Excel:', error);
        res.status(500).json({ message: 'Error generating report' });
    }
};

exports.exportIncidentsPDF = async (req, res) => {
    try {
        const [incidents] = await db.query(`
            SELECT i.id, i.title, i.status, a.name as application_name, i.reported_at
            FROM incidents i
            LEFT JOIN applications a ON i.application_id = a.id
            WHERE i.deleted_at IS NULL
        `);

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=incidents_report.pdf');

        doc.pipe(res);

        doc.fontSize(20).text('Koda ERP - Incident Report', { align: 'center' });
        doc.moveDown();

        incidents.forEach(incident => {
            doc.fontSize(12).text(`ID: ${incident.id}`);
            doc.text(`Title: ${incident.title}`);
            doc.text(`App: ${incident.application_name}`);
            doc.text(`Status: ${incident.status}`);
            doc.text(`Date: ${incident.reported_at}`);
            doc.moveDown();
        });

        doc.end();
    } catch (error) {
        console.error('Error exporting incidents to PDF:', error);
        res.status(500).json({ message: 'Error generating report' });
    }
};
