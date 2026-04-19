import { z } from 'zod';

export const projectStatusEnum = ['draft', 'planning', 'in_progress', 'on_hold', 'completed', 'cancelled'] as const;
export const projectPriorityEnum = ['low', 'medium', 'high', 'urgent'] as const;
export const taskStatusEnum = ['pending', 'in_progress', 'completed', 'cancelled'] as const;
export const taskPriorityEnum = ['low', 'medium', 'high', 'urgent'] as const;

export const projectQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(1000).default(20),
  status: z.enum(projectStatusEnum).optional(),
  manager_id: z.string().uuid().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const projectIdParamSchema = z.object({
  id: z.string().uuid({ message: '项目ID必须是有效的UUID' }),
});

export const createProjectSchema = z.object({
  name: z.string().min(1, '项目名称不能为空').max(200, '项目名称不能超过200个字符'),
  description: z.string().max(2000).optional(),
  customer_id: z.string().uuid().optional(),
  manager_id: z.string().uuid({ message: '项目经理ID必须是有效的UUID' }),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  budget: z.number().positive().optional(),
  priority: z.enum(projectPriorityEnum).optional(),
  status: z.enum(projectStatusEnum).optional(),
  location: z.string().max(200).optional(),
  contact_person: z.string().max(100).optional(),
  contact_phone: z.string().max(20).optional(),
  contact_email: z.string().email().optional(),
  remarks: z.string().max(1000).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const taskQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(1000).default(20),
  status: z.enum(taskStatusEnum).optional(),
  assignee_id: z.string().uuid().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const taskIdParamSchema = z.object({
  taskId: z.string().uuid({ message: '任务ID必须是有效的UUID' }),
});

export const createTaskSchema = z.object({
  project_id: z.string().uuid({ message: '项目ID必须是有效的UUID' }),
  name: z.string().min(1, '任务名称不能为空').max(200, '任务名称不能超过200个字符'),
  description: z.string().max(2000).optional(),
  assignee_id: z.string().uuid().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  estimated_hours: z.number().positive().optional(),
  priority: z.enum(taskPriorityEnum).optional(),
  status: z.enum(taskStatusEnum).optional(),
  parent_task_id: z.string().uuid().optional(),
  remarks: z.string().max(1000).optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export type ProjectQuery = z.infer<typeof projectQuerySchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type TaskQuery = z.infer<typeof taskQuerySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
