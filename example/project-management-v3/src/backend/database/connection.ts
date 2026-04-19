import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

// 仅在开发环境打印数据库配置信息
if (process.env.NODE_ENV === 'development') {
  console.log('DB Config:');
  console.log('  host:', process.env.DB_HOST);
  console.log('  port:', process.env.DB_PORT);
  console.log('  user:', process.env.DB_USERNAME);
  console.log('  database:', process.env.DB_DATABASE);
}

/**
 * 数据库连接池
 */
class Database {
  private pool: mysql.Pool | null = null;

  /**
   * 创建连接池
   */
  async connect(): Promise<void> {
    try {
      const config = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_DATABASE || 'project_mgmt_v3',
        waitForConnections: true,
        connectionLimit: 30,
        queueLimit: 100,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        idleTimeout: 60000,
      };
      
      this.pool = mysql.createPool(config);

      const connection = await this.pool.getConnection();
      console.log('✅ 数据库连接成功');
      connection.release();
    } catch (error) {
      console.error('❌ 数据库连接失败:', error);
      throw error;
    }
  }

  /**
   * 关闭连接池
   */
  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  /**
   * 执行查询
   */
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    if (!this.pool) {
      throw new Error('数据库未连接');
    }
    const [rows] = await this.pool.query(sql, params);
    return rows as T[];
  }

  /**
   * 执行单条查询
   */
  async queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows[0] || null;
  }

  /**
   * 执行插入
   */
  async insert(sql: string, params?: any[]): Promise<any> {
    if (!this.pool) {
      throw new Error('数据库未连接');
    }
    const [result] = await this.pool.query(sql, params);
    return result;
  }

  /**
   * 执行更新
   */
  async update(sql: string, params?: any[]): Promise<any> {
    return this.insert(sql, params);
  }

  /**
   * 执行删除
   */
  async execute(sql: string, params?: any[]): Promise<any> {
    return this.insert(sql, params);
  }

  /**
   * 开启事务
   */
  async transaction<T>(callback: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> {
    if (!this.pool) {
      throw new Error('数据库未连接');
    }
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

export const db = new Database();
