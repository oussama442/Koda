const axios = require('axios');
const NodeCache = require('node-cache');

// TTL of 5 minutes to respect rate limits
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
const GITLAB_API_BASE = 'https://gitlab.com/api/v4';

const fetchWithCache = async (url, token) => {
    const cacheKey = `${url}:${token}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
        console.log(`Serving from cache: ${url}`);
        return cachedData;
    }

    try {
        const response = await axios.get(url, {
            headers: { 'PRIVATE-TOKEN': token }
        });
        cache.set(cacheKey, response.data);
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 429) {
            console.error('GitLab Rate Limit Hit!');
            throw new Error('Rate limit exceeded. Please try again later.');
        }
        throw error;
    }
};

exports.getCommits = async (projectId, token) => {
    return fetchWithCache(`${GITLAB_API_BASE}/projects/${projectId}/repository/commits`, token);
};

exports.getBranches = async (projectId, token) => {
    return fetchWithCache(`${GITLAB_API_BASE}/projects/${projectId}/repository/branches`, token);
};

exports.getMergeRequests = async (projectId, token) => {
    return fetchWithCache(`${GITLAB_API_BASE}/projects/${projectId}/merge_requests`, token);
};

exports.getPipelines = async (projectId, token) => {
    return fetchWithCache(`${GITLAB_API_BASE}/projects/${projectId}/pipelines`, token);
};

exports.getProjectDetails = async (projectId, token) => {
    return fetchWithCache(`${GITLAB_API_BASE}/projects/${projectId}`, token);
};
