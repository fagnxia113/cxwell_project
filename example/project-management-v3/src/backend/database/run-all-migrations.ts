import mysql from 'mysql2/promise';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function runAllMigrations() {
  const migrationsDir = join(process.cwd(), 'src/backend/database/migrations');
  const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  
  console.log(`Found ${files.length} migration files`);
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'project_management_v2',
    multipleStatements: true
  });

  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    try {
      const sqlPath = join(migrationsDir, file);
      const sqlScript = readFileSync(sqlPath, 'utf-8');
      const cleanedScript = sqlScript.replace(/^--.*$/gm, '').trim();
      
      if (!cleanedScript) continue;
      
      const statements = cleanedScript
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      for (const statement of statements) {
        await connection.query(statement);
      }
      
      console.log(`✅ ${file}`);
      successCount++;
    } catch (error: any) {
      console.log(`⚠️  ${file}: ${error.message.substring(0, 80)}`);
      errorCount++;
    }
  }

  console.log(`\n✅ 迁移完成: ${successCount} 成功, ${errorCount} 失败`);
  await connection.end();
}

runAllMigrations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('迁移失败:', error);
    process.exit(1);
  });
