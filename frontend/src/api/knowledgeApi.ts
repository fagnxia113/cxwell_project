import { apiClient } from '../utils/apiClient';

export const knowledgeApi = {
  /**
   * 获取知识库树形结构
   */
  getTree: () => {
    return apiClient.get<any>('/api/knowledge/tree');
  },

  /**
   * 创建文件夹
   */
  create: (data: any) => {
    return apiClient.post<any>('/api/knowledge', data);
  },

  /**
   * 上传文件
   */
  upload: (formData: FormData) => {
    return apiClient.upload<any>('/api/knowledge/upload', formData);
  },

  /**
   * 更新基本信息
   */
  update: (id: string, data: any) => {
    return apiClient.put<any>(`/api/knowledge/${id}`, data);
  },

  /**
   * 删除节点
   */
  delete: (id: string) => {
    return apiClient.delete<any>(`/api/knowledge/${id}`);
  },

  /**
   * 获取节点权限
   */
  getPermissions: (id: string) => {
    return apiClient.get<any>(`/api/knowledge/${id}/permissions`);
  },

  /**
   * 更新节点权限
   */
  updatePermissions: (id: string, data: { visibilityType: string; permissions: any[] }) => {
    return apiClient.put<any>(`/api/knowledge/${id}/permissions`, data);
  },

  transferOwner: (id: string, newOwnerLoginName: string) => {
    return apiClient.put<any>(`/api/knowledge/${id}/transfer`, { newOwnerLoginName });
  }
};
