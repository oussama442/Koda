const db = require('../config/db');
const gitlabService = require('../services/gitlabService');

exports.syncCommits = async (req, res) => {
    try {
        const { application_id } = req.body;
        const token = process.env.GITLAB_TOKEN;

        if (!token) return res.status(400).json({ message: 'GitLab token not configured' });

        const [[app]] = await db.query('SELECT gitlab_repo_url FROM applications WHERE id = ?', [application_id]);
        if (!app || !app.gitlab_repo_url) return res.status(400).json({ message: 'No GitLab URL configured for this application' });

        const gitlabProjectId = app.gitlab_repo_url.split('/').pop().replace('.git', '');
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

exports.getApplicationCommits = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM git_commits WHERE application_id = ? ORDER BY committed_at DESC', [req.params.appId]);
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

        // Extract project ID from URL (naive approach: last part of path)
        const projectId = app.gitlab_repo_url.split('/').pop().replace('.git', '');
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

        const projectId = app.gitlab_repo_url.split('/').pop().replace('.git', '');
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

        const projectId = app.gitlab_repo_url.split('/').pop().replace('.git', '');
        const pipelines = await gitlabService.getPipelines(projectId, process.env.GITLAB_TOKEN);
        res.json(pipelines);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching pipelines' });
    }
};
