const db = require('../config/db');
const gitlabService = require('../services/gitlabService');

const getEncodedProjectId = (url) => {
    if (!url) return '';
    const cleanUrl = url.replace(/\.git$/, '');
    let pathWithNamespace = '';
    if (cleanUrl.includes('gitlab.com/')) {
        pathWithNamespace = cleanUrl.split('gitlab.com/')[1];
    } else if (cleanUrl.includes('gitlab.com:')) {
        pathWithNamespace = cleanUrl.split('gitlab.com:')[1];
    } else {
        pathWithNamespace = cleanUrl.split('/').pop();
    }
    return encodeURIComponent(pathWithNamespace);
};

exports.syncCommits = async (req, res) => {
    try {
        const { application_id } = req.body;
        const token = process.env.GITLAB_TOKEN;

        if (!token) return res.status(400).json({ message: 'GitLab token not configured' });

        const [[app]] = await db.query('SELECT gitlab_repo_url FROM applications WHERE id = ?', [application_id]);
        if (!app || !app.gitlab_repo_url) return res.status(400).json({ message: 'No GitLab URL configured for this application' });

        const gitlabProjectId = getEncodedProjectId(app.gitlab_repo_url);
        const commits = await gitlabService.getCommits(gitlabProjectId, token);

        for (const commit of commits) {
            const [existing] = await db.query('SELECT id FROM git_commits WHERE commit_hash = ?', [commit.id]);
            if (existing.length === 0) {
                await db.query(
                    'INSERT INTO git_commits (application_id, commit_hash, message, committed_at) VALUES (?, ?, ?, ?)',
                    [application_id, commit.id, commit.message, commit.committed_date]
                );
            }
        }

        res.json({ message: 'Commits synced successfully', count: commits.length });
    } catch (error) {
        console.error('Error syncing commits:', error);
        res.status(500).json({ message: 'Error syncing commits' });
    }
};

exports.getAllCommits = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT c.*, a.name as application_name 
            FROM git_commits c 
            JOIN applications a ON c.application_id = a.id 
            WHERE a.deleted_at IS NULL 
            ORDER BY c.committed_at DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getApplicationCommits = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT c.*, a.name as application_name 
            FROM git_commits c 
            JOIN applications a ON c.application_id = a.id 
            WHERE c.application_id = ? AND a.deleted_at IS NULL 
            ORDER BY c.committed_at DESC
        `, [req.params.appId]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getBranches = async (req, res) => {
    try {
        const { appId } = req.params;
        const [[app]] = await db.query('SELECT gitlab_repo_url FROM applications WHERE id = ?', [appId]);
        if (!app || !app.gitlab_repo_url) return res.json([]);

        const projectId = getEncodedProjectId(app.gitlab_repo_url);
        const branches = await gitlabService.getBranches(projectId, process.env.GITLAB_TOKEN);
        res.json(branches);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching branches' });
    }
};

exports.getMergeRequests = async (req, res) => {
    try {
        const { appId } = req.params;
        const [[app]] = await db.query('SELECT gitlab_repo_url FROM applications WHERE id = ?', [appId]);
        if (!app || !app.gitlab_repo_url) return res.json([]);

        const projectId = getEncodedProjectId(app.gitlab_repo_url);
        const mrs = await gitlabService.getMergeRequests(projectId, process.env.GITLAB_TOKEN);
        res.json(mrs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching merge requests' });
    }
};

exports.getPipelines = async (req, res) => {
    try {
        const { appId } = req.params;
        const [[app]] = await db.query('SELECT gitlab_repo_url FROM applications WHERE id = ?', [appId]);
        if (!app || !app.gitlab_repo_url) return res.json([]);

        const projectId = getEncodedProjectId(app.gitlab_repo_url);
        const pipelines = await gitlabService.getPipelines(projectId, process.env.GITLAB_TOKEN);
        res.json(pipelines);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching pipelines' });
    }
};
