import { singleton, inject } from 'tsyringe';
import type { IProjectRepository } from '../domain/IProjectRepository.js';
import { Task } from '../domain/Task.entity.js';
import type { TaskType, TaskStatus, TaskPriority } from '../domain/Task.entity.js';
import { v4 as uuidv4 } from 'uuid';

export interface CreateTaskDto {
  projectId: string;
  parentId?: string | null;
  name: string;
  taskType?: TaskType;
  description?: string;
  assigneeId?: string | null;
  plannedStartDate: string | Date;
  plannedEndDate: string | Date;
  priority?: TaskPriority;
}

@singleton()
export class TaskUseCase {
  constructor(
    @inject('IProjectRepository') private repository: IProjectRepository
  ) {}

  async createTask(dto: CreateTaskDto) {
    // 1. Generate WBS Code
    const wbsCode = await this.generateWBSCode(dto.projectId, dto.parentId || null);
    
    // 2. Determine WBS Path
    let wbsPath = wbsCode;
    if (dto.parentId) {
      const parent = await this.repository.findTaskById(dto.parentId);
      if (parent) {
        wbsPath = `${parent.toJSON().wbsPath}/${wbsCode}`;
      }
    }

    const task = new Task({
      projectId: dto.projectId,
      parentId: dto.parentId,
      wbsCode,
      wbsPath,
      name: dto.name,
      taskType: dto.taskType,
      description: dto.description,
      assigneeId: dto.assigneeId,
      plannedStartDate: dto.plannedStartDate,
      plannedEndDate: dto.plannedEndDate,
      priority: dto.priority
    });

    const saved = await this.repository.saveTask(task);
    return saved.toJSON();
  }

  async updateTaskProgress(id: string, progress: number) {
    const taskRecord = await this.repository.findTaskById(id);
    if (!taskRecord) throw new Error('任务不存在');

    taskRecord.updateProgress(progress);
    await this.repository.saveTask(taskRecord);

    // If it has a parent, trigger parent progress recalculation
    if (taskRecord.parentId) {
      await this.recalculateParentProgress(taskRecord.parentId);
    } else {
      // If it's a root task, update project progress
      await this.recalculateProjectProgress(taskRecord.projectId);
    }

    return taskRecord.toJSON();
  }

  async generateWBSCode(projectId: string, parentId: string | null): Promise<string> {
    const lastCode = await this.repository.getMaxSiblingWBSCode(projectId, parentId);
    
    if (!parentId) {
      // Root level: 1, 2, 3...
      const nextNum = lastCode ? parseInt(lastCode) + 1 : 1;
      return `${nextNum}`;
    }

    // Child level: parentCode.1, parentCode.2...
    const parent = await this.repository.findTaskById(parentId);
    if (!parent) throw new Error('Parent task not found');
    
    const parentCode = parent.wbsCode;
    if (!lastCode) return `${parentCode}.1`;
    
    const parts = lastCode.split('.');
    const lastNum = parseInt(parts[parts.length - 1]);
    return `${parentCode}.${lastNum + 1}`;
  }

  private async recalculateParentProgress(parentId: string) {
    const parent = await this.repository.findTaskById(parentId);
    if (!parent) return;

    const children = await this.repository.findChildTasks(parentId);
    if (children.length === 0) return;

    const avgProgress = children.reduce((sum, child) => sum + child.progress, 0) / children.length;
    parent.updateProgress(Math.round(avgProgress));
    await this.repository.saveTask(parent);

    // Recursively update upwards
    if (parent.parentId) {
      await this.recalculateParentProgress(parent.parentId);
    } else {
      await this.recalculateProjectProgress(parent.projectId);
    }
  }

  private async recalculateProjectProgress(projectId: string) {
    const rootTasks = await this.repository.findTasksByProject(projectId);
    const topLevelTasks = rootTasks.filter(t => !t.parentId);
    
    if (topLevelTasks.length === 0) return;

    const avgProgress = topLevelTasks.reduce((sum, task) => sum + task.progress, 0) / topLevelTasks.length;
    await this.repository.updateProjectProgress(projectId, Math.round(avgProgress));
  }

  async getTasksByProject(projectId: string) {
    const tasks = await this.repository.findTasksByProject(projectId);
    return tasks.map(t => t.toJSON());
  }

  async deleteTask(id: string) {
    const task = await this.repository.findTaskById(id);
    if (!task) return;

    // Check for children
    const children = await this.repository.findChildTasks(id);
    if (children.length > 0) throw new Error('无法删除包含子任务的任务');

    // Soft delete logic in repository would handle it, but here we might need more
    // Actually our repo.delete(id) for projects handles project-wide.
    // For individual task deletion, we need a repo.deleteTask(id)
  }
}
