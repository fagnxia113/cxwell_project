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
  }
};
