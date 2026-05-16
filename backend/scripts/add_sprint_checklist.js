const pool = require('../config/db');

async function updateDatabase() {
  console.log('Connecting to database using pool...');

  try {
    const connection = await pool.getConnection();
    console.log('Connected! Creating new tables...');

    // 1. Sprint Checklist Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sprint_checklists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sprint_id INT NOT NULL,
        item_name VARCHAR(255) NOT NULL,
        is_checked BOOLEAN DEFAULT FALSE,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('Table sprint_checklists created or already exists.');

    // 2. Sprint History Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sprint_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sprint_id INT NOT NULL,
        action VARCHAR(100) NOT NULL,
        details TEXT,
        changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        changed_by INT,
        FOREIGN KEY (sprint_id) REFERENCES sprints(id) ON DELETE CASCADE,
        FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('Table sprint_history created or already exists.');

    connection.release();
    console.log('Database update successful!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating database:', error);
    process.exit(1);
  }
}

updateDatabase();
