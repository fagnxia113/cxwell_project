import { apiClient } from '../utils/apiClient';

export const workflowApi = {
  // 获取流程定义列表
  getDefinitions: () => apiClient.get<any>('/api/workflow/definition/list'),

  // 获取流程定义详情
  getDefinitionDetail: (id: string) => apiClient.get<any>(`/api/workflow/definition/${id}`),

  // 发布流程
  publish: (id: string) => apiClient.post<any>(`/api/workflow/definition/${id}/publish`),

  // 创建流程定义
  createDefinition: (data: { flowCode: string; flowName: string; category?: string; version: string }) =>
    apiClient.post<any>('/api/workflow/definition/create', data),

  // 保存流程设计
  saveDesign: (id: string, design: any) =>
    apiClient.post<any>(`/api/workflow/definition/${id}/design`, design),

  // 启动流程 (正式发起)
  startProcess: (data: { flowCode: string; businessId?: string; title?: string; variables?: any }) =>
    apiClient.post<any>('/api/workflow/start', data),

  // 保存为草稿
  saveWorkflowDraft: (data: { definitionId: string; businessId: string; variables: any }) =>
    apiClient.post<any>('/api/workflow/tasks/draft/save', data),

  // 提交草稿 (转正)
  submitWorkflowDraft: (instanceId: string) =>
    apiClient.post<any>(`/api/workflow/tasks/draft/${instanceId}/submit`, {}),

  // --- 任务中心 (新：若依标准对齐) ---

  // 待办、已办、发起、草稿
  getHubTodo: () => apiClient.get<any>('/api/workflow/tasks/hub/todo'),
  getHubDone: () => apiClient.get<any>('/api/workflow/tasks/hub/done'),
  getHubOwn: () => apiClient.get<any>('/api/workflow/tasks/hub/own'),
  getHubDraft: () => apiClient.get<any>('/api/workflow/tasks/hub/draft'),

  // 获取任务详情 (含上下文)
  getTaskDetail: (taskId: string) => apiClient.get<any>(`/api/workflow/tasks/${taskId}/detail`),

  // 获取流转轨迹
  getTimeline: (instanceId: string) => apiClient.get<any>(`/api/workflow/tasks/timeline/${instanceId}`),

  // 办理任务 (通过/驳回/退回等)
  submitTask: (taskId: string, action: 'pass' | 'reject' | 'rollback', variables: any = {}, message: string = '', targetNodeCode?: string) =>
    apiClient.post<any>(`/api/workflow/tasks/${taskId}/submit`, { action, variables, message, targetNodeCode }),

  // 获取可退回的历史节点
  getHistory: (instanceId: string) => apiClient.get<any>(`/api/workflow/tasks/history/${instanceId}`),

  // 驳回接口 (流程结束)
  reject: (taskId: string, comment: string) =>
    apiClient.post<any>('/api/workflow/tasks/reject', { taskId, comment }),

  // 退回接口 (回退到指定节点，继续运行)
  rollback: (taskId: string, comment: string, targetNodeCode?: string) =>
    apiClient.post<any>('/api/workflow/tasks/rollback', { taskId, comment, targetNodeCode }),

  // 兼容旧调用名
  getDoneTasks: () => apiClient.get<any>('/api/workflow/tasks/hub/done'),
};
