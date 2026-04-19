import { db } from '../database/connection.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

export interface MilestoneDto {
  id?: string;
  project_id: string;
  name: string;
  description?: string;
  planned_start_date: string;
  planned_end_date: string;
  weight: number;
}

export interface ResourceDto {
  id?: string;
  milestone_id: string;
  resource_name: string;
  required_count: number;
  collected_count: number;
  notes?: string;
}

export class MilestoneService {
  /**
   * 创建或更新里程碑 (直存模式)
   */
  async saveMilestones(projectId: string, milestones: any[]): Promise<void> {
    await db.transaction(async (conn) => {
      // 1. 获取现有里程碑数据以保留进度
      const [rows] = await conn.query('SELECT id, progress, status, actual_end_date FROM project_milestones WHERE project_id = ?', [projectId]);
      const existingMap = new Map((rows as any[]).map(r => [r.id, r]));

      // 2. 清理现有里程碑 (级联删除资源)
      await conn.execute('DELETE FROM project_milestones WHERE project_id = ?', [projectId]);

      // 3. 重新插入
      for (const m of milestones) {
        const id = m.id || uuidv4();
        const existing = existingMap.get(id);
        
        await conn.execute(
          `INSERT INTO project_milestones (
            id, project_id, name, description, 
            planned_start_date, planned_end_date, weight, 
            progress, status, actual_end_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id, projectId, m.name, m.description || null,
            m.planned_start_date, m.planned_end_date, m.weight,
            existing ? existing.progress : (m.progress || 0),
            existing ? existing.status : (m.status || 'pending'),
            existing ? existing.actual_end_date : (m.actual_end_date || null)
          ]
        );
      }

      // 4. 更新项目总进度
      await this.updateProjectProgressWithConn(conn, projectId);
    });
  }

  /**
   * 获取项目所有里程碑
   */
  async getProjectMilestones(projectId: string): Promise<any[]> {
    const milestones = await db.query(
      `SELECT * FROM project_milestones WHERE project_id = ? ORDER BY planned_start_date ASC`,
      [projectId]
    );

    for (const milestone of milestones) {
      milestone.resources = await db.query(
        `SELECT * FROM milestone_resources WHERE milestone_id = ?`,
        [milestone.id]
      );
    }

    return milestones;
  }

  /**
   * 更新里程碑进度及实际完成时间
   */
  async updateMilestoneProgress(
    milestoneId: string,
    progress: number,
    actualEndDate?: string,
    forcedStatus?: string,
    actualStartDate?: string
  ): Promise<void> {
    await db.transaction(async (conn: any) => {
      const [rows] = await conn.query(
        'SELECT project_id FROM project_milestones WHERE id = ?',
        [milestoneId]
      );
      const milestone = (rows as any[])[0];

      if (!milestone) throw new Error('里程碑不存在');

      let status = forcedStatus || 'in_progress';
      if (!forcedStatus) {
        if (progress >= 100) status = 'completed';
        else if (progress <= 0) status = 'pending';
      }

      const updates: string[] = ['progress = ?', 'updated_at = NOW()']
      const params: any[] = [progress]

      if (actualEndDate !== undefined) {
        updates.push('actual_end_date = ?')
        params.push(actualEndDate || (progress >= 100 ? new Date().toISOString().split('T')[0] : null))
      }

      if (status) {
        updates.push('status = ?')
        params.push(status)
      }

      if (actualStartDate !== undefined) {
        updates.push('actual_start_date = ?')
        params.push(actualStartDate)
      }

      params.push(milestoneId)

      await conn.execute(
        `UPDATE project_milestones SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      // 重新计算项目总进度
      await this.updateProjectProgressWithConn(conn, milestone.project_id);
    });
  }

  /**
   * 资源收编管理
   */
  async saveResources(milestoneId: string, resources: ResourceDto[]): Promise<void> {
    await db.transaction(async (conn) => {
      await conn.execute('DELETE FROM milestone_resources WHERE milestone_id = ?', [milestoneId]);

      for (const r of resources) {
        const status = r.collected_count >= r.required_count ? 'complete' : 'incomplete';
        await conn.execute(
          `INSERT INTO milestone_resources (
            id, milestone_id, resource_name, required_count, collected_count, notes, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [uuidv4(), milestoneId, r.resource_name, r.required_count, r.collected_count, r.notes || null, status]
        );
      }
    });
  }

  /**
   * 计算并更新项目总进度
   */
  private async updateProjectProgressWithConn(conn: any, projectId: string): Promise<void> {
    const [milestones] = await conn.query(
      'SELECT weight, progress, status FROM project_milestones WHERE project_id = ?',
      [projectId]
    );

    let totalProgress = 0;
    let hasInProgressMilestone = false;
    for (const m of milestones) {
      totalProgress += (Number(m.weight) * (m.progress / 100));
      if (m.status === 'in_progress' || m.progress > 0) {
        hasInProgressMilestone = true;
      }
    }

    const roundedProgress = Math.min(100, Math.round(totalProgress));

    const [projectRows] = await conn.query('SELECT status FROM projects WHERE id = ?', [projectId]);
    const currentStatus = (projectRows as any[])[0]?.status;

    if (hasInProgressMilestone && (currentStatus === 'proposal' || currentStatus === 'initiated')) {
      await conn.execute(
        'UPDATE projects SET progress = ?, status = ?, updated_at = NOW() WHERE id = ?',
        [roundedProgress, 'in_progress', projectId]
      );
    } else {
      await conn.execute(
        'UPDATE projects SET progress = ?, updated_at = NOW() WHERE id = ?',
        [roundedProgress, projectId]
      );
    }
  }

  /**
   * 检查里程碑预警
   */
  async checkMilestoneAlerts(): Promise<void> {
    const now = new Date().toISOString().split('T')[0];
    const delayedMilestones = await db.query<any>(
      `SELECT m.*, p.name as project_name, p.manager_id 
       FROM project_milestones m
       JOIN projects p ON m.project_id = p.id
       WHERE m.status != 'completed' AND m.planned_end_date < ?`,
      [now]
    );

    // TODO: 调用 NotificationService 发送预警给项目经理
    logger.info(`Found ${delayedMilestones.length} delayed milestones.`);
  }
}

export const milestoneService = new MilestoneService();
