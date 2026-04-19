const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function executeSync() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'project_mgmt_v3',
    multipleStatements: true
  });

  try {
    const sqlPath = path.join(__dirname, 'sync_v3_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing sync_v3_schema.sql...');
    await connection.query(sql);
    console.log('Database synchronization completed successfully.');
  } catch (error) {
    console.error('Error during database synchronization:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

executeSync();
