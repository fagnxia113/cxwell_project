import { apiClient } from '../utils/apiClient'

/**
 * 流程定义接口
 */
export interface FlowDefinition {
  id: string
  flowCode: string
  flowName: string
  category: string
  version: string
  isPublish: number
}

/**
 * 工作流 API 服务 (对接适配 7 表新后端)
 */
export const workflowApi = {
  // --- 流程定义 (Definition) ---
  
  /** 获取流程定义列表 */
  getDefinitions: async () => {
    return apiClient.get<{ success: boolean, data: FlowDefinition[] }>('/api/workflow/definition/list')
  },

  /** 获取单个流程的设计详情 (含节点和连线) */
  getDefinitionDetail: async (id: string) => {
    return apiClient.get<any>(`/api/workflow/definition/${id}`)
  },

  /** 创建流程定义 */
  createDefinition: async (data: { flowCode: string, flowName: string, category?: string, version: string }) => {
    return apiClient.post<any>('/api/workflow/definition/create', data)
  },

  /** 保存流程设计器数据 (Nodes & Edges) */
  saveDesign: async (id: string, design: { nodes: any[], skips: any[] }) => {
    return apiClient.post<any>(`/api/workflow/definition/${id}/design`, design)
  },

  /** 发布流程 */
  publish: async (id: string) => {
    return apiClient.post<any>(`/api/workflow/definition/${id}/publish`)
  },

  // --- 流程实例与任务 (Engine & Task) ---

  /** 发起流程实例 */
  startProcess: async (definitionId: string, businessId: string) => {
    return apiClient.post<any>('/api/workflow/start', { definitionId, businessId })
  },

  /** 完成/审批通过任务 */
  completeTask: async (taskId: string, variables: any = {}, comment: string = '') => {
    return apiClient.post<any>('/api/workflow/complete', { taskId, variables, comment })
  },

  /** 驳回任务 (流程结束) */
  rejectTask: async (taskId: string, comment: string) => {
    return apiClient.post<any>('/api/workflow/reject', { taskId, comment })
  },

  /** 退回任务 (回退到指定节点，继续运行) */
  rollbackTask: async (taskId: string, comment: string, targetNodeCode?: string) => {
    return apiClient.post<any>('/api/workflow/rollback', { taskId, comment, targetNodeCode })
  },

  /** 撤回/取消实例 */
  cancelProcess: async (instanceId: string) => {
    return apiClient.post<any>('/api/workflow/cancel', { instanceId })
  },

  /** 获取我的待办任务 */
  getTodoTasks: async () => {
    return apiClient.get<any>('/api/workflow/tasks/todo')
  },

  /** 获取我的已办记录 */
  getDoneTasks: async () => {
    return apiClient.get<any>('/api/workflow/tasks/done')
  },

  /** 获取流程流转时间轴/轨迹 */
  getTimeline: async (instanceId: string) => {
    return apiClient.get<any>(`/api/workflow/tasks/timeline/${instanceId}`)
  },

  /** 根据业务 ID 获取流程实例 (适配项目管理详情页) */
  getInstanceByBusinessId: async (businessId: string) => {
    // 假设后端支持此过滤，或者前端先拉取我的实例再过滤
    // 暂时用 processes 列表并在前端过滤，或者如果有特定接口则使用
    const res = await apiClient.get<any>(`/api/workflow/processes`)
    if (res.success && Array.isArray(res.data)) {
      const target = res.data.find((inst: any) => inst.business_id === businessId || inst.businessId === businessId)
      return { success: true, data: target }
    }
    return { success: false, data: null }
  },

  /** 获取轨迹 (兼容旧调用) */
  getTrajectory: async (instanceId: string) => {
    return apiClient.get<any>(`/api/workflow/tasks/timeline/${instanceId}`)
  },

  /** 获取我的待办 (兼容旧调用) */
  getPendingTasks: async () => {
    return apiClient.get<any>('/api/workflow/tasks/todo')
  },

  /** 审批任务 (兼容旧调用) */
  approveTask: async (taskId: string, params: { message: string, skipType: 'PASS' | 'REJECT' }) => {
    if (params.skipType === 'PASS') {
      return apiClient.post<any>('/api/workflow/complete', { taskId, comment: params.message })
    } else {
      return apiClient.post<any>('/api/workflow/reject', { taskId, comment: params.message })
    }
  },

  /** 撤回实例 (兼容旧调用) */
  withdrawInstance: async (instanceId: string) => {
    return apiClient.post<any>('/api/workflow/cancel', { instanceId })
  }
}
