class ProjectInputError extends Error {}

function positiveId(value, field, optional = false) {
    const normalized = typeof value === 'string' ? value.trim() : value;
    if (optional && (normalized === undefined || normalized === null || normalized === '')) {
        return null;
    }
    const isNumeric = typeof normalized === 'number'
        || (typeof normalized === 'string' && /^\d+$/.test(normalized));
    const id = isNumeric ? Number(normalized) : NaN;
    if (!Number.isInteger(id) || id < 1 || id > 2147483647) {
        throw new ProjectInputError(`${field} must be a positive integer between 1 and 2147483647.`);
    }
    return id;
}

function optionalDate(value, field) {
    const normalized = typeof value === 'string' ? value.trim() : value;
    if (normalized === undefined || normalized === null || normalized === '') return null;

    if (typeof normalized === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
        const [year, month, day] = normalized.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        if (year >= 1000 && date.getUTCFullYear() === year
            && date.getUTCMonth() === month - 1 && date.getUTCDate() === day) {
            return normalized;
        }
    }
    throw new ProjectInputError(`${field} must be a valid date in YYYY-MM-DD format (1000-9999), or empty.`);
}

function projectValues(body) {
    const applicationId = positiveId(body?.application_id, 'application_id');
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    // MariaDB VARCHAR counts Unicode characters, not JavaScript UTF-16 units.
    if (!name || Array.from(name).length > 150) {
        throw new ProjectInputError('Project name is required and must be at most 150 characters.');
    }
    return [
        applicationId,
        name,
        body.description ?? null,
        optionalDate(body.start_date, 'start_date'),
        optionalDate(body.end_date, 'end_date'),
        positiveId(body.chef_projet_id, 'chef_projet_id (project manager)', true)
    ];
}

module.exports = { projectValues, ProjectInputError };
