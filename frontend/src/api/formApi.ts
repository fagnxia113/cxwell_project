import { apiClient } from '../utils/apiClient';

export const formApi = {
  /**
   * 获取表单模板
   */
  getTemplate: (key: string) => {
    return apiClient.get<any>(`/api/form/template/${key}`);
  },

  /**
   * 保存草稿
   */
  saveDraft: (templateKey: string, formData: any) => {
    return apiClient.post<any>('/api/form/draft', { templateKey, formData });
  },

  /**
   * 获取草稿
   */
  getDraft: (key: string) => {
    return apiClient.get<any>(`/api/form/draft/${key}`);
  },

  /**
   * 删除草稿
   */
  deleteDraft: (key: string) => {
    return apiClient.delete<any>(`/api/form/draft/${key}`);
  }
};
