import { z } from 'zod';

export const warehouseStatusEnum = ['active', 'inactive', 'maintenance'] as const;
export const warehouseTypeEnum = ['main', 'branch', 'project'] as const;

export const warehouseQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(1000).default(20),
  search: z.string().optional(),
  status: z.enum(warehouseStatusEnum).optional(),
  type: z.enum(warehouseTypeEnum).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const warehouseIdParamSchema = z.object({
  id: z.string().uuid({ message: '仓库ID必须是有效的UUID' }),
});

export const createWarehouseSchema = z.object({
  name: z.string().min(1, '仓库名称不能为空').max(100, '仓库名称不能超过100个字符'),
  code: z.string().max(50).optional(),
  type: z.enum(warehouseTypeEnum).optional(),
  location: z.string().max(200).optional(),
  address: z.string().max(200).optional(),
  area: z.number().positive().optional(),
  capacity: z.number().positive().optional(),
  manager_id: z.string().uuid().optional().or(z.literal('')),
  contact_person: z.string().max(50).optional(),
  contact_phone: z.string().max(20).optional(),
  status: z.enum(warehouseStatusEnum).optional(),
  temperature_control: z.boolean().optional(),
  humidity_control: z.boolean().optional(),
  remarks: z.string().max(1000).optional(),
});

export const updateWarehouseSchema = createWarehouseSchema.partial();

export const warehouseEquipmentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(1000).default(20),
  search: z.string().optional(),
});

export type WarehouseQuery = z.infer<typeof warehouseQuerySchema>;
export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;
