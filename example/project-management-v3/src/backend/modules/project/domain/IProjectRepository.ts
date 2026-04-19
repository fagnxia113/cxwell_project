import { Project } from './Project.entity.js';
import { Task } from './Task.entity.js';

export interface IProjectRepository {
  // Projects
  save(project: Project): Promise<Project>;
  findById(id: string): Promise<Project | null>;
  findAll(params: {
    search?: string;
    status?: string;
    manager_id?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ data: Project[]; total: number }>;
  delete(id: string): Promise<void>;

  // Tasks
  saveTask(task: Task): Promise<Task>;
  findTaskById(id: string): Promise<Task | null>;
  findTasksByProject(projectId: string): Promise<Task[]>;
  deleteTask(id: string): Promise<void>;
  deleteTasksByProject(projectId: string): Promise<void>;
  
  // WBS / Hierarchy
  findChildTasks(parentId: string): Promise<Task[]>;
  getMaxSiblingWBSCode(projectId: string, parentId: string | null): Promise<string | null>;
  
  // Progress Sync
  updateProjectProgress(projectId: string, progress: number): Promise<void>;
}
