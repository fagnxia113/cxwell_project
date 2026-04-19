import { v4 as uuidv4 } from 'uuid';

export type TaskType = 'milestone' | 'subtask' | 'process';
export type TaskStatus = 'unassigned' | 'assigned' | 'in_progress' | 'completed' | 'paused' | 'delayed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ITaskProps {
  id?: string;
  projectId: string;
  parentId?: string | null;
  assigneeName?: string | null;
  wbsPath: string; // From root to current
  wbsCode: string; // e.g. 1.1.2
  name: string;
  taskType?: TaskType;
  description?: string;
  assigneeId?: string | null;
  plannedStartDate: Date | string;
  plannedEndDate: Date | string;
  actualStartDate?: Date | string | null;
  actualEndDate?: Date | string | null;
  progress?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export class Task {
  private props: ITaskProps;

  constructor(props: ITaskProps) {
    this.props = {
      ...props,
      id: props.id || uuidv4(),
      taskType: props.taskType || 'subtask',
      status: props.status || 'unassigned',
      priority: props.priority || 'medium',
      progress: props.progress || 0
    };
  }

  get id(): string { return this.props.id!; }
  get projectId(): string { return this.props.projectId; }
  get parentId(): string | null | undefined { return this.props.parentId; }
  get wbsCode(): string { return this.props.wbsCode; }
  get progress(): number { return this.props.progress!; }

  public updateProgress(progress: number) {
    if (progress < 0 || progress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }
    this.props.progress = progress;
    if (progress === 100) {
      this.props.status = 'completed';
      this.props.actualEndDate = new Date();
    } else if (progress > 0 && this.props.status === 'assigned') {
      this.props.status = 'in_progress';
      this.props.actualStartDate = this.props.actualStartDate || new Date();
    }
    this.props.updatedAt = new Date();
  }

  public toJSON() {
    return {
      ...this.props,
      // For backward compatibility
      project_id: this.props.projectId,
      parent_id: this.props.parentId,
      wbs_path: this.props.wbsPath,
      wbs_code: this.props.wbsCode,
      task_type: this.props.taskType,
      assignee_id: this.props.assigneeId,
      assignee: this.props.assigneeName,
      planned_start_date: this.props.plannedStartDate,
      planned_end_date: this.props.plannedEndDate,
      actual_start_date: this.props.actualStartDate,
      actual_end_date: this.props.actualEndDate
    };
  }
}
