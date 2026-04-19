import { z } from 'zod';

export const equipmentStatusEnum = ['active', 'inactive', 'maintenance', 'retired', 'scrapped'] as const;
export const locationStatusEnum = ['in_storage', 'in_use', 'in_transfer', 'in_repair', 'returned'] as const;
export const healthStatusEnum = ['excellent', 'good', 'fair', 'poor'] as const;
export const usageStatusEnum = ['idle', 'in_use', 'reserved'] as const;
export const equipmentCategoryEnum = ['instrument', 'device', 'tool', 'fixture'] as const;
export const equipmentSourceEnum = ['purchase', 'transfer', 'lease', 'gift'] as const;

export const equipmentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(1000).default(20),
  model_id: z.string().uuid().optional(),
  location_id: z.string().uuid().optional(),
  status: z.enum(equipmentStatusEnum).optional(),
  search: z.string().optional(),
  location_status: z.enum(locationStatusEnum).optional(),
  category: z.enum(equipmentCategoryEnum).optional(),
  health_status: z.enum(healthStatusEnum).optional(),
  usage_status: z.enum(usageStatusEnum).optional(),
  equipment_source: z.enum(equipmentSourceEnum).optional(),
  aggregated: z.coerce.boolean().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const equipmentIdParamSchema = z.object({
  id: z.string().uuid({ message: '设备ID必须是有效的UUID' }),
});

export const createEquipmentSchema = z.object({
  name: z.string().min(1, '设备名称不能为空').max(200, '设备名称不能超过200个字符'),
  category: z.enum(equipmentCategoryEnum),
  model_no: z.string().max(100).optional(),
  serial_number: z.string().max(100).optional(),
  manufacturer: z.string().max(200).optional(),
  purchase_date: z.string().datetime().optional(),
  purchase_price: z.number().positive().optional(),
  warranty_end_date: z.string().datetime().optional(),
  location_id: z.string().uuid().optional(),
  location_status: z.enum(locationStatusEnum).optional(),
  health_status: z.enum(healthStatusEnum).optional(),
  usage_status: z.enum(usageStatusEnum).optional(),
  equipment_source: z.enum(equipmentSourceEnum).optional(),
  supplier: z.string().max(200).optional(),
  technical_params: z.record(z.string(), z.any()).optional(),
  management_number: z.string().max(100).optional(),
  remarks: z.string().max(1000).optional(),
});

export const updateEquipmentSchema = createEquipmentSchema.partial().extend({
  status: z.enum(equipmentStatusEnum).optional(),
});

export const equipmentTransferSchema = z.object({
  from_location_id: z.string().uuid({ message: '源仓库ID必须是有效的UUID' }),
  to_location_id: z.string().uuid({ message: '目标仓库ID必须是有效的UUID' }),
  equipment_ids: z.array(z.string().uuid()).min(1, '至少选择一个设备'),
  dispatcher_id: z.string().uuid({ message: '调度员ID必须是有效的UUID' }),
  scheduled_date: z.string().datetime().optional(),
  remarks: z.string().max(1000).optional(),
});

export const equipmentInboundSchema = z.object({
  warehouse_id: z.string().uuid({ message: '仓库ID必须是有效的UUID' }),
  equipment_ids: z.array(z.string().uuid()).min(1, '至少选择一个设备'),
  inbound_date: z.string().datetime().optional(),
  operator_id: z.string().uuid({ message: '操作员ID必须是有效的UUID' }),
  remarks: z.string().max(1000).optional(),
});

export const equipmentRepairSchema = z.object({
  equipment_id: z.string().uuid({ message: '设备ID必须是有效的UUID' }),
  repair_type: z.enum(['maintenance', 'calibration', 'inspection', 'repair']).optional(),
  vendor_id: z.string().uuid().optional(),
  expected_return_date: z.string().datetime().optional(),
  description: z.string().max(1000).optional(),
  operator_id: z.string().uuid({ message: '操作员ID必须是有效的UUID' }),
});


export type EquipmentQuery = z.infer<typeof equipmentQuerySchema>;
export type CreateEquipmentInput = z.infer<typeof createEquipmentSchema>;
export type UpdateEquipmentInput = z.infer<typeof updateEquipmentSchema>;
export type EquipmentTransferInput = z.infer<typeof equipmentTransferSchema>;
export type EquipmentInboundInput = z.infer<typeof equipmentInboundSchema>;
export type EquipmentRepairInput = z.infer<typeof equipmentRepairSchema>;

export const repairStatusEnum = ['pending', 'in_progress', 'completed', 'cancelled'] as const;
export const repairQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(1000).default(20),
  status: z.enum(repairStatusEnum).optional(),
  equipment_id: z.string().uuid().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});


export const inboundQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(1000).default(20),
  status: z.string().optional(),
  warehouse_id: z.string().uuid().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const inboundExecutionSchema = z.object({
  inbound_order_id: z.string().uuid({ message: '入库单ID必须是有效的UUID' }),
  equipment_ids: z.array(z.string().uuid()).optional(),
  operator_id: z.string().uuid({ message: '操作员ID必须是有效的UUID' }),
  remarks: z.string().max(1000).optional(),
});
