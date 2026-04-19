import { db } from '../database/connection.js';
import { v4 as uuidv4 } from 'uuid';

export type NotificationType = 'email' | 'sms' | 'push' | 'in_app';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: string; user_id: string; user_name: string; type: NotificationType;
  title: string; content: string; priority: NotificationPriority;
  link?: string; is_read: boolean; read_at?: Date; sent_at?: Date;
  status: 'pending' | 'sent' | 'failed'; error_message?: string; created_at: Date;
}

export class NotificationService {
  async sendNotification(params: {
    user_id: string; user_name?: string; type: NotificationType;
    title: string; content: string; priority?: NotificationPriority; link?: string
  }): Promise<Notification> {
    const id = uuidv4();
    let userName = params.user_name;
    if (!userName && params.user_id) {
      const user = await db.queryOne<{ name: string }>('SELECT name FROM employees WHERE id = ?', [params.user_id]);
      userName = user?.name || '用户';
    }

    await db.insert(`INSERT INTO notifications (id, user_id, user_name, type, title, content, priority, link, is_read, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, false, 'pending', NOW())`,
      [id, params.user_id, userName, params.type, params.title, params.content, params.priority || 'normal', params.link || null]);

    try {
      switch (params.type) {
        case 'email': await this.sendEmail(params.user_id, params.title, params.content); break;
        case 'sms': await this.sendSMS(params.user_id, params.content); break;
        case 'push': await this.sendPush(params.user_id, params.title, params.content); break;
      }
      await db.execute(`UPDATE notifications SET status = 'sent', sent_at = NOW() WHERE id = ?`, [id]);
    } catch (error: any) {
      await db.execute(`UPDATE notifications SET status = 'failed', error_message = ? WHERE id = ?`, [error.message, id]);
    }
    return db.queryOne<Notification>('SELECT * FROM notifications WHERE id = ?', [id]) as Promise<Notification>;
  }

  async sendBatchNotifications(notifications: Array<{
    user_id: string; user_name?: string; type: NotificationType;
    title: string; content: string; priority?: NotificationPriority; link?: string
  }>): Promise<void> {
    for (const notification of notifications) await this.sendNotification(notification);
  }

  private async sendEmail(userId: string, subject: string, content: string): Promise<void> {
    const user = await db.queryOne<{ email: string }>('SELECT email FROM employees WHERE id = ?', [userId]);
    if (!user?.email) return;
    console.log(`[NotificationService] 发送邮件到 ${user.email}: ${subject}`);
  }

  private async sendSMS(userId: string, content: string): Promise<void> {
    const user = await db.queryOne<{ phone: string }>('SELECT phone FROM employees WHERE id = ?', [userId]);
    if (!user?.phone) return;
    console.log(`[NotificationService] 发送短信到 ${user.phone}: ${content}`);
  }

  private async sendPush(userId: string, title: string, content: string): Promise<void> {
    console.log(`[NotificationService] 发送推送通知给用户 ${userId}: ${title}`);
  }

  async getUserNotifications(userId: string, params?: { is_read?: boolean; type?: NotificationType; limit?: number }): Promise<Notification[]> {
    let sql = 'SELECT * FROM notifications WHERE user_id = ?';
    const values: any[] = [userId];
    if (params?.is_read !== undefined) { sql += ' AND is_read = ?'; values.push(params.is_read); }
    if (params?.type) { sql += ' AND type = ?'; values.push(params.type); }
    sql += ' ORDER BY created_at DESC';
    if (params?.limit) { sql += ' LIMIT ?'; values.push(params.limit); }
    return db.query<Notification>(sql, values);
  }

  async markAsRead(notificationId: string): Promise<void> {
    await db.execute('UPDATE notifications SET is_read = true, read_at = NOW() WHERE id = ?', [notificationId]);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await db.execute('UPDATE notifications SET is_read = true, read_at = NOW() WHERE user_id = ? AND is_read = false', [userId]);
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = false', [userId]);
    return result?.count || 0;
  }
}

export const notificationService = new NotificationService();