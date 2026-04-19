import { z } from 'zod';

export const processKeySchema = z.object({
  processKey: z.string().min(1, '流程标识不能为空').max(100),
});

export const startProcessSchema = z.object({
  processKey: z.string().min(1, '流程标识不能为空').max(100),
  title: z.string().max(200).optional(),
  businessId: z.string().max(100).optional(),
  businessKey: z.string().max(100).optional(),
  variables: z.record(z.string(), z.any()).optional(),
  initiator: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
  }).optional(),
});

export const instanceIdParamSchema = z.object({
  instanceId: z.string().uuid({ message: '实例ID必须是有效的UUID' }),
});

export const taskIdParamSchema = z.object({
  taskId: z.string().uuid({ message: '任务ID必须是有效的UUID' }),
});

export const completeTaskSchema = z.object({
  action: z.enum(['approve', 'approved', 'reject', 'complete', 'return'], { message: '操作类型必须是 approve/reject/complete/return' }),
  comment: z.string().max(1000).optional(),
  operator: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
  }).optional(),
});

export const claimTaskSchema = z.object({
  userId: z.string().uuid({ message: '用户ID必须是有效的UUID' }),
  userName: z.string().min(1, '用户名不能为空'),
});

export const transferTaskSchema = z.object({
  targetUserId: z.string().uuid({ message: '目标用户ID必须是有效的UUID' }),
  targetUserName: z.string().min(1, '目标用户名不能为空'),
  comment: z.string().max(1000).optional(),
});

export const rollbackTaskSchema = z.object({
  targetNodeId: z.string().min(1, '目标节点ID不能为空'),
  operator: z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
  }),
  comment: z.string().max(1000).optional(),
});

export const addSignerSchema = z.object({
  newSigners: z.array(z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
  })).min(1, '至少需要添加一个会签人'),
  operator: z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
  }),
  comment: z.string().max(1000).optional(),
});

export const terminateInstanceSchema = z.object({
  reason: z.string().max(500).optional(),
  operator: z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
  }).optional(),
});

export const resumeInstanceSchema = z.object({
  fromNodeId: z.string().optional(),
});

export const jumpInstanceSchema = z.object({
  targetNodeId: z.string().min(1, '目标节点ID不能为空'),
  operator: z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
  }),
  reason: z.string().max(500).optional(),
});

export const rollbackInstanceSchema = z.object({
  operator: z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
  }),
  reason: z.string().max(500).optional(),
});

export const forceCompleteTaskSchema = z.object({
  result: z.enum(['approved', 'rejected'], { message: '结果必须是 approved/rejected' }),
  operator: z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
  }),
  comment: z.string().max(1000).optional(),
});

export const forceCloseInstanceSchema = z.object({
  operator: z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
  }),
  reason: z.string().max(500).optional(),
});

export const suspendInstanceSchema = z.object({
  reason: z.string().max(500).optional(),
  operator: z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
  }).optional(),
});

export const reassignTaskSchema = z.object({
  newAssignee: z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
  }),
  operator: z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
  }),
  reason: z.string().max(500).optional(),
});

export type StartProcessInput = z.infer<typeof startProcessSchema>;
export type CompleteTaskInput = z.infer<typeof completeTaskSchema>;
export type TransferTaskInput = z.infer<typeof transferTaskSchema>;
export type AddSignerInput = z.infer<typeof addSignerSchema>;
