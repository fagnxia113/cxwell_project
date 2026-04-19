import { singleton } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/connection.js';
import { logger } from '../utils/logger.js';

export type AuditAction = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'status_change'
  | 'approve' 
  | 'reject'
  | 'transfer'
  | 'transfer_shipped'
  | 'transfer_received'
  | 'transfer_received_partial'
  | 'login'
  | 'logout';

export interface AuditLogEntry {
  id?: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  operatorId?: string;
  operatorName?: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  changes?: Record<string, { from: any; to: any }>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

@singleton()
export class AuditService {
  async log(entry: AuditLogEntry, tx?: any): Promise<void> {
    try {
      const id = entry.id || uuidv4();
      
      const sql = `INSERT INTO audit_logs 
         (id, entity_type, entity_id, action, operator_id, operator_name, old_value, new_value, changes, ip_address, user_agent, request_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
      const params = [
        id,
        entry.entityType,
        entry.entityId,
        entry.action,
        entry.operatorId || null,
        entry.operatorName || null,
        entry.oldValue ? JSON.stringify(entry.oldValue) : null,
        entry.newValue ? JSON.stringify(entry.newValue) : null,
        entry.changes ? JSON.stringify(entry.changes) : null,
        entry.ipAddress || null,
        entry.userAgent || null,
        entry.requestId || null
      ];

      if (tx && typeof tx.$executeRawUnsafe === 'function') {
        await tx.$executeRawUnsafe(sql, ...params);
      } else {
        await db.execute(sql, params);
      }

      logger.debug(`Audit log created: ${entry.entityType}.${entry.action}`, { 
        entityId: entry.entityId,
        operatorId: entry.operatorId 
      });
    } catch (error) {
      logger.error('Failed to create audit log:', error as Error);
    }
  }

  async logStatusChange(
    entityType: string,
    entityId: string,
    oldStatus: string,
    newStatus: string,
    operator?: { id: string; name: string },
    extra?: Record<string, any>
  ): Promise<void> {
    await this.log({
      entityType,
      entityId,
      action: 'status_change',
      operatorId: operator?.id,
      operatorName: operator?.name,
      changes: {
        status: { from: oldStatus, to: newStatus },
        ...extra
      }
    });
  }

  async logUpdate(
    entityType: string,
    entityId: string,
    oldValue: Record<string, any>,
    newValue: Record<string, any>,
    operator?: { id: string; name: string }
  ): Promise<void> {
    const changes: Record<string, { from: any; to: any }> = {};
    
    for (const key of Object.keys({ ...oldValue, ...newValue })) {
      if (oldValue[key] !== newValue[key]) {
        changes[key] = {
          from: oldValue[key],
          to: newValue[key]
        };
      }
    }

    if (Object.keys(changes).length === 0) {
      return;
    }

    await this.log({
      entityType,
      entityId,
      action: 'update',
      operatorId: operator?.id,
      operatorName: operator?.name,
      oldValue,
      newValue,
      changes
    });
  }

  async logCreate(
    entityType: string,
    entityId: string,
    newValue: Record<string, any>,
    operator?: { id: string; name: string }
  ): Promise<void> {
    await this.log({
      entityType,
      entityId,
      action: 'create',
      operatorId: operator?.id,
      operatorName: operator?.name,
      newValue
    });
  }

  async logDelete(
    entityType: string,
    entityId: string,
    oldValue?: Record<string, any>,
    operator?: { id: string; name: string }
  ): Promise<void> {
    await this.log({
      entityType,
      entityId,
      action: 'delete',
      operatorId: operator?.id,
      operatorName: operator?.name,
      oldValue
    });
  }

  async getAuditLogs(params: {
    entityType?: string;
    entityId?: string;
    operatorId?: string;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: any[]; total: number }> {
    const { entityType, entityId, operatorId, action, startDate, endDate, page = 1, pageSize = 20 } = params;
    
    const conditions: string[] = [];
    const values: any[] = [];

    if (entityType) {
      conditions.push('entity_type = ?');
      values.push(entityType);
    }
    if (entityId) {
      conditions.push('entity_id = ?');
      values.push(entityId);
    }
    if (operatorId) {
      conditions.push('operator_id = ?');
      values.push(operatorId);
    }
    if (action) {
      conditions.push('action = ?');
      values.push(action);
    }
    if (startDate) {
      conditions.push('created_at >= ?');
      values.push(startDate);
    }
    if (endDate) {
      conditions.push('created_at <= ?');
      values.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * pageSize;

    const [data, countResult] = await Promise.all([
      db.query(
        `SELECT * FROM audit_logs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...values, pageSize, offset]
      ),
      db.queryOne(
        `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`,
        values
      )
    ]);

    return {
      data: data.map((row: any) => ({
        ...row,
        old_value: row.old_value ? JSON.parse(row.old_value) : null,
        new_value: row.new_value ? JSON.parse(row.new_value) : null,
        changes: row.changes ? JSON.parse(row.changes) : null
      })),
      total: countResult?.total || 0
    };
  }
}

export const auditService = new AuditService();
