import { apiClient } from '../utils/apiClient';

export const orgApi = {
  /**
   * 获取部门树
   */
  getDeptTree: () => {
    return apiClient.get<any>('/api/organization/dept/tree');
  },

  /**
   * 获取职员列表
   */
  getEmployees: (params: {
    pageNum?: number;
    pageSize?: number;
    name?: string;
    deptId?: string;
  }) => {
    return apiClient.get<any>('/api/organization/employee/list', { params });
  },

  /**
   * 获取岗位列表
   */
  getPositions: (params: {
    pageNum?: number;
    pageSize?: number;
    postName?: string;
    status?: string;
  }) => {
    return apiClient.get<any>('/api/organization/position/list', { params });
  }
};
