import { apiClient } from '../utils/apiClient';

export const projectApi = {
  /**
   * 获取项目列表
   */
  getProjects: (params: {
    pageNum?: number;
    pageSize?: number;
    projectName?: string;
    status?: string;
  }) => {
    return apiClient.get<any>('/api/project/list', { params });
  },

  /**
   * 获取项目详情
   */
  getProjectDetail: (id: string) => {
    return apiClient.get<any>(`/api/project/${id}`);
  },

  /**
   * 获取指定项目的风险列表
   */
  getProjectRisks: (projectId: string) => {
    return apiClient.get<any>(`/api/project/extension/${projectId}/risks`);
  },

  /**
   * 获取聚合任务看板数据
   */
  getTaskBoard: () => {
    return apiClient.get<any>('/api/project/task-board');
  }
};
