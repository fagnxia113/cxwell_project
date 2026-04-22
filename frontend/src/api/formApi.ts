import { apiClient } from '../utils/apiClient';

export const formApi = {
  /**
   * 获取所有表单模板
   */
  getTemplates: () => {
    return apiClient.get<any>('/api/workflow/form-templates/templates');
  },

  /**
   * 获取表单模板
   */
  getTemplate: (id: string) => {
    return apiClient.get<any>(`/api/workflow/form-templates/${id}`);
  },

  /**
   * 创建表单模板
   */
  createTemplate: (data: any) => {
    return apiClient.post<any>('/api/workflow/form-templates', data);
  },

  /**
   * 更新表单模板
   */
  updateTemplate: (id: string, data: any) => {
    return apiClient.put<any>(`/api/workflow/form-templates/${id}`, data);
  },

  /**
   * 删除表单模板
   */
  deleteTemplate: (id: string) => {
    return apiClient.delete<any>(`/api/workflow/form-templates/${id}`);
  },

  /**
   * 复制表单模板
   */
  copyTemplate: (id: string) => {
    return apiClient.post<any>(`/api/workflow/form-templates/${id}/copy`);
  },

  /**
   * 保存草稿 (原 logic 仍保留在 /form 路径或根据需要更新)
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
