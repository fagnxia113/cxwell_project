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

console.log('DB Config:', DB_CONFIG);

async function createDatabase() {
  console.log('Creating database...');
  const connection = await mysql.createConnection({
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password
  });

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` 
      DEFAULT CHARACTER SET utf8mb4 
      COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ 数据库 ${DB_CONFIG.database} 创建成功`);
  } catch (error) {
    console.error('❌ 创建数据库失败:', error);
  } finally {
    await connection.end();
  }
}

async function executeSQLFile(filePath: string) {
  console.log('Executing SQL file:', filePath);
  
  const connection = await mysql.createConnection({
    ...DB_CONFIG,
    multipleStatements: true
  });
  
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log('SQL file loaded, length:', sql.length);
    
    await connection.query(sql);
    console.log('✅ SQL 文件执行成功');
  } catch (error) {
    console.error('❌ 执行 SQL 文件失败:', error);
  } finally {
    await connection.end();
  }
}

async function initializeDatabase() {
  console.log('========================================');
  console.log('开始初始化数据库...');
  console.log('========================================');
  
  await createDatabase();
  
  console.log('\n2. 执行数据库初始化脚本...');
  const sqlFilePath = path.join(__dirname, 'init_database_v3_new.sql');
  await executeSQLFile(sqlFilePath);
  
  console.log('\n========================================');
  console.log('✅ 数据库初始化完成！');
  console.log('========================================');
  console.log(`\n数据库名称: ${DB_CONFIG.database}`);
  console.log(`数据库地址: ${DB_CONFIG.host}:${DB_CONFIG.port}`);
  console.log(`\n默认管理员账号:`);
  console.log(`  用户名: admin`);
  console.log(`  密码: admin123`);
  console.log(`\n请及时修改默认密码！\n`);
}

initializeDatabase();