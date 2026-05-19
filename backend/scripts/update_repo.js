const db = require('../config/db');
db.query("UPDATE applications SET gitlab_repo_url = 'https://gitlab.com/oussama442-group/Koda' WHERE name = 'koda'")
  .then(() => {
    console.log('Reverted DB to GitLab');
    process.exit(0);
  })
  .catch(console.error);
