const db = require('../config/db');

async function seedPermissions() {
    const permissions = [
        // User management
        { name: 'view_users', description: 'Can view the list of users' },
        { name: 'create_user', description: 'Can create new users' },
        { name: 'edit_user', description: 'Can edit existing users' },
        { name: 'delete_user', description: 'Can delete users' },
        
        // Role management
        { name: 'view_roles', description: 'Can view the list of roles' },
        { name: 'create_role', description: 'Can create new roles' },
        { name: 'edit_role', description: 'Can edit existing roles' },
        { name: 'delete_role', description: 'Can delete roles' },
        
        // Application management
        { name: 'view_applications', description: 'Can view applications' },
        { name: 'create_application', description: 'Can create applications' },
        
        // Project management
        { name: 'view_projects', description: 'Can view projects' },
        { name: 'create_project', description: 'Can create projects' },
    ];

    console.log('Seeding permissions...');

    for (const perm of permissions) {
        try {
            await db.query(
                'INSERT IGNORE INTO permissions (permission_name, description) VALUES (?, ?)',
                [perm.name, perm.description]
            );
            console.log(`Permission ${perm.name} seeded.`);
        } catch (error) {
            console.error(`Error seeding ${perm.name}:`, error.message);
        }
    }

    console.log('Permissions seeding complete.');
    process.exit(0);
}

seedPermissions();
