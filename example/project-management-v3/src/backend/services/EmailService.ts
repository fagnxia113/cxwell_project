import nodemailer from 'nodemailer';
import { db } from '../database/connection.js';
import { logger } from '../utils/logger.js';

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  secure: boolean;
}

/**
 * 邮件服务
 * SMTP 配置从 system_configs 表动态读取
 */
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private configCache: SmtpConfig | null = null;
  private cacheExpiry: number = 0;

  /**
   * 从数据库加载 SMTP 配置
   */
  private async getSmtpConfig(): Promise<SmtpConfig | null> {
    // 缓存 5 分钟
    if (this.configCache && Date.now() < this.cacheExpiry) {
      return this.configCache;
    }

    try {
      const configs = await db.query<any>(
        `SELECT config_key, config_value FROM system_configs WHERE config_key LIKE 'smtp_%'`
      );

      if (!configs || configs.length === 0) {
        logger.warn('[EmailService] 未配置 SMTP 参数');
        return null;
      }

      const configMap: Record<string, string> = {};
      for (const c of configs) {
        configMap[c.config_key] = c.config_value;
      }

      const host = configMap['smtp_host'];
      const port = configMap['smtp_port'];
      const user = configMap['smtp_user'];
      const pass = configMap['smtp_pass'];
      const from = configMap['smtp_from'];

      if (!host || !port || !user || !pass) {
        logger.warn('[EmailService] SMTP 配置不完整');
        return null;
      }

      this.configCache = {
        host,
        port: parseInt(port) || 587,
        user,
        pass,
        from: from || user,
        secure: parseInt(port) === 465
      };
      this.cacheExpiry = Date.now() + 5 * 60 * 1000;

      return this.configCache;
    } catch (error: any) {
      logger.error('[EmailService] 读取 SMTP 配置失败:', error);
      return null;
    }
  }

  /**
   * 获取或创建 transporter
   */
  private async getTransporter(): Promise<nodemailer.Transporter | null> {
    const config = await this.getSmtpConfig();
    if (!config) return null;

    // 如果配置变更需要重建
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass
      }
    });

    return this.transporter;
  }

  /**
   * 发送邮件
   */
  async sendMail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();
      if (!transporter) {
        logger.warn('[EmailService] 邮件未发送 - SMTP 未配置');
        return false;
      }

      const config = await this.getSmtpConfig();
      
      await transporter.sendMail({
        from: `"项目管理系统" <${config!.from}>`,
        to,
        subject,
        html
      });

      logger.info(`[EmailService] 邮件发送成功: ${to} - ${subject}`);
      return true;
    } catch (error: any) {
      logger.error(`[EmailService] 邮件发送失败: ${error.message}`, error);
      return false;
    }
  }

  /**
   * 批量发送邮件
   */
  async sendBatch(recipients: Array<{ email: string; name: string }>, subject: string, html: string): Promise<void> {
    for (const r of recipients) {
      if (r.email) {
        await this.sendMail(r.email, subject, html);
      }
    }
  }

  /**
   * 测试 SMTP 连接
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const transporter = await this.getTransporter();
      if (!transporter) {
        return { success: false, message: 'SMTP 未配置' };
      }

      await transporter.verify();
      return { success: true, message: 'SMTP 连接测试成功' };
    } catch (error: any) {
      return { success: false, message: `SMTP 连接失败: ${error.message}` };
    }
  }

  /**
   * 清除配置缓存（配置更新后调用）
   */
  clearCache(): void {
    this.configCache = null;
    this.cacheExpiry = 0;
    this.transporter = null;
  }

  /**
   * 保存 SMTP 配置到数据库
   */
  async saveConfig(config: Partial<SmtpConfig>): Promise<void> {
    const fields: Record<string, string | undefined> = {
      'smtp_host': config.host,
      'smtp_port': config.port?.toString(),
      'smtp_user': config.user,
      'smtp_pass': config.pass,
      'smtp_from': config.from
    };

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        await db.execute(
          `INSERT INTO system_configs (id, config_key, config_value, description)
           VALUES (UUID(), ?, ?, ?)
           ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), updated_at = NOW()`,
          [key, value, `SMTP ${key.replace('smtp_', '').toUpperCase()}`]
        );
      }
    }

    this.clearCache();
    logger.info('[EmailService] SMTP 配置已更新');
  }

  /**
   * 获取当前配置（密码脱敏）
   */
  async getCurrentConfig(): Promise<any> {
    const config = await this.getSmtpConfig();
    if (!config) return null;

    return {
      host: config.host,
      port: config.port,
      user: config.user,
      pass: config.pass ? '******' : '',
      from: config.from,
      secure: config.secure
    };
  }
}

export const emailService = new EmailService();
