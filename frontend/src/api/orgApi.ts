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
  },

  /**
   * 创建部门
   */
  createDept: (data: any) => {
    return apiClient.post<any>('/api/organization/departments', data);
  },

  /**
   * 更新部门
   */
  updateDept: (id: string, data: any) => {
    return apiClient.put<any>(`/api/organization/departments/${id}`, data);
  },

  /**
   * 删除部门
   */
  deleteDept: (id: string) => {
    return apiClient.delete<any>(`/api/organization/departments/${id}`);
  },

  /**
   * 创建岗位
   */
  createPosition: (data: any) => {
    return apiClient.post<any>('/api/organization/positions', data);
  },

  /**
   * 更新岗位
   */
  updatePosition: (id: string, data: any) => {
    return apiClient.put<any>(`/api/organization/positions/${id}`, data);
  },

  /**
   * 删除岗位
   */
  deletePosition: (id: string) => {
    return apiClient.delete<any>(`/api/organization/positions/${id}`);
  },

  /**
   * 获取职员详情
   */
  getEmployeeById: (id: string) => {
    return apiClient.get<any>(`/api/organization/employee/${id}`);
  }
};
