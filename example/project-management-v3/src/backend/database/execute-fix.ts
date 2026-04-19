import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'project_mgmt_v3'
};

async function executeSQLFile(filePath: string) {
  console.log('Connecting to database...');
  const connection = await mysql.createConnection({
    ...DB_CONFIG,
    multipleStatements: true
  });
  
  try {
    console.log('Executing SQL file:', filePath);
    const sql = fs.readFileSync(filePath, 'utf8');
    await connection.query(sql);
    console.log('✅ SQL 文件执行成功');
  } catch (error: any) {
    console.error('❌ 执行 SQL 失败:', error.message);
  } finally {
    await connection.end();
  }
}

const fixScriptPath = path.join(__dirname, 'fix_missing_tables.sql');
executeSQLFile(fixScriptPath);
