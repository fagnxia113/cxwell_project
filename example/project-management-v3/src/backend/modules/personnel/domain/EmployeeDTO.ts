import { z } from 'zod';

export const employeeStatusEnum = ['active', 'inactive', 'probation', 'resigned', 'terminated'] as const;
export const employeeGenderEnum = ['male', 'female', 'other'] as const;
export const employeeTypeEnum = ['full_time', 'part_time', 'contract', 'intern'] as const;

export const employeeQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(1000).default(20),
  search: z.string().optional(),
  status: z.enum(employeeStatusEnum).optional(),
  department_id: z.string().uuid().optional(),
  role: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const employeeIdParamSchema = z.object({
  id: z.string().uuid({ message: '员工ID必须是有效的UUID' }),
});

export const createEmployeeSchema = z.object({
  name: z.string().min(1, '员工姓名不能为空').max(50, '员工姓名不能超过50个字符'),
  employee_no: z.string().max(50).optional(),
  gender: z.enum(employeeGenderEnum).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email({ message: '邮箱格式不正确' }).optional().or(z.literal('')),
  id_card: z.string().max(20).optional(),
  department_id: z.string().uuid().optional(),
  position: z.string().max(100).optional(),
  employee_type: z.enum(employeeTypeEnum).optional(),
  hire_date: z.string().datetime().optional(),
  contract_start_date: z.string().datetime().optional(),
  contract_end_date: z.string().datetime().optional(),
  salary: z.number().positive().optional(),
  emergency_contact: z.string().max(100).optional(),
  emergency_phone: z.string().max(20).optional(),
  bank_account: z.string().max(30).optional(),
  bank_name: z.string().max(100).optional(),
  education: z.string().max(50).optional(),
  major: z.string().max(100).optional(),
  graduation_school: z.string().max(100).optional(),
  address: z.string().max(200).optional(),
  remarks: z.string().max(1000).optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export type EmployeeQuery = z.infer<typeof employeeQuerySchema>;
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
