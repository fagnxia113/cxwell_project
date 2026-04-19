import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * 数据库类型枚举
 */
export enum DatabaseType {
  MYSQL = 'mysql',
  POSTGRESQL = 'postgresql',
  SQLSERVER = 'sqlserver',
  ORACLE = 'oracle',
  SQLITE = 'sqlite',
}

/**
 * 数据库配置服务
 * 用于管理不同数据库的连接和配置
 */
@Injectable()
export class DatabaseConfigService {
  private databaseType: DatabaseType;
  private config: any;

  constructor(private configService: ConfigService) {
    this.init();
  }

  /**
   * 初始化数据库配置
   */
  private init() {
    // 从配置中获取数据库类型
    const dbType = this.configService.get<string>('database.type') || 'mysql';
    this.databaseType = this.parseDatabaseType(dbType);

    // 从配置中获取数据库连接信息
    this.config = {
      host: this.configService.get<string>('database.host') || 'localhost',
      port: this.configService.get<number>('database.port') || this.getDefaultPort(),
      username: this.configService.get<string>('database.username') || 'root',
      password: this.configService.get<string>('database.password') || '',
      database: this.configService.get<string>('database.database') || 'warm_flow',
      ssl: this.configService.get<boolean>('database.ssl') || false,
    };
  }

  /**
   * 解析数据库类型
   */
  private parseDatabaseType(type: string): DatabaseType {
    const lowerType = type.toLowerCase();
    switch (lowerType) {
      case 'mysql':
        return DatabaseType.MYSQL;
      case 'postgresql':
      case 'postgres':
        return DatabaseType.POSTGRESQL;
      case 'sqlserver':
      case 'mssql':
        return DatabaseType.SQLSERVER;
      case 'oracle':
        return DatabaseType.ORACLE;
      case 'sqlite':
        return DatabaseType.SQLITE;
      default:
        return DatabaseType.MYSQL;
    }
  }

  /**
   * 获取默认端口
   */
  private getDefaultPort(): number {
    switch (this.databaseType) {
      case DatabaseType.MYSQL:
        return 3306;
      case DatabaseType.POSTGRESQL:
        return 5432;
      case DatabaseType.SQLSERVER:
        return 1433;
      case DatabaseType.ORACLE:
        return 1521;
      case DatabaseType.SQLITE:
        return 0;
      default:
        return 3306;
    }
  }

  /**
   * 获取数据库类型
   */
  getDatabaseType(): DatabaseType {
    return this.databaseType;
  }

  /**
   * 获取数据库配置
   */
  getConfig() {
    return this.config;
  }

  /**
   * 获取数据库连接字符串
   */
  getConnectionString(): string {
    switch (this.databaseType) {
      case DatabaseType.MYSQL:
        return `mysql://${this.config.username}:${this.config.password}@${this.config.host}:${this.config.port}/${this.config.database}`;
      case DatabaseType.POSTGRESQL:
        return `postgresql://${this.config.username}:${this.config.password}@${this.config.host}:${this.config.port}/${this.config.database}`;
      case DatabaseType.SQLSERVER:
        return `mssql://${this.config.username}:${this.config.password}@${this.config.host}:${this.config.port}/${this.config.database}`;
      case DatabaseType.ORACLE:
        return `oracle://${this.config.username}:${this.config.password}@${this.config.host}:${this.config.port}/${this.config.database}`;
      case DatabaseType.SQLITE:
        return `sqlite:${this.config.database}.db`;
      default:
        return `mysql://${this.config.username}:${this.config.password}@${this.config.host}:${this.config.port}/${this.config.database}`;
    }
  }

  /**
   * 检查数据库连接
   */
  async checkConnection(): Promise<boolean> {
    // 这里可以添加数据库连接检查逻辑
    // 例如：尝试建立数据库连接并执行简单查询
    return true;
  }

  /**
   * 获取数据库方言
   */
  getDialect(): string {
    switch (this.databaseType) {
      case DatabaseType.MYSQL:
        return 'mysql';
      case DatabaseType.POSTGRESQL:
        return 'postgres';
      case DatabaseType.SQLSERVER:
        return 'mssql';
      case DatabaseType.ORACLE:
        return 'oracle';
      case DatabaseType.SQLITE:
        return 'sqlite';
      default:
        return 'mysql';
    }
  }
}