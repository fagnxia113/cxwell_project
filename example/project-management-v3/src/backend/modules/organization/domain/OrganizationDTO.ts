import { z } from 'zod';

export const departmentStatusEnum = ['active', 'inactive'] as const;

export const departmentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(1000).default(20),
  search: z.string().optional(),
  status: z.enum(departmentStatusEnum).optional(),
  parent_id: z.string().optional().or(z.literal('')),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const departmentIdParamSchema = z.object({
  id: z.string().min(1, { message: '部门ID不能为空' }),
});

export const createDepartmentSchema = z.object({
  name: z.string().min(1, '部门名称不能为空').max(100, '部门名称不能超过100个字符'),
  code: z.string().max(50).optional(),
  parent_id: z.string().optional().or(z.literal('')).nullable(),
  manager_id: z.string().optional().or(z.literal('')).nullable(),
  status: z.enum(departmentStatusEnum).optional(),
  sort_order: z.number().int().optional(),
  description: z.string().max(500).optional(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();

export const positionStatusEnum = ['active', 'inactive'] as const;
export const positionCategoryEnum = ['management', 'technical', 'sales', 'support', 'other'] as const;

export const positionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(1000).default(20),
  search: z.string().optional(),
  status: z.enum(positionStatusEnum).optional(),
  category: z.enum(positionCategoryEnum).optional(),
  department_id: z.string().optional().or(z.literal('')),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const positionIdParamSchema = z.object({
  id: z.string().min(1, { message: '职位ID不能为空' }),
});

export const createPositionSchema = z.object({
  name: z.string().min(1, '职位名称不能为空').max(100, '职位名称不能超过100个字符'),
  code: z.string().max(50).optional(),
  department_id: z.string().optional().nullable(),
  department_name: z.string().optional().nullable(),
  category: z.enum(positionCategoryEnum).optional().nullable(),
  level: z.number().int().optional(),
  status: z.enum(positionStatusEnum).optional(),
  description: z.string().max(500).optional(),
  responsibilities: z.string().max(1000).optional(),
  requirements: z.string().max(1000).optional(),
});

export const updatePositionSchema = createPositionSchema.partial();

export type DepartmentQuery = z.infer<typeof departmentQuerySchema>;
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type PositionQuery = z.infer<typeof positionQuerySchema>;
export type CreatePositionInput = z.infer<typeof createPositionSchema>;
export type UpdatePositionInput = z.infer<typeof updatePositionSchema>;
