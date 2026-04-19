import { apiClient } from '../utils/apiClient';

export const customerApi = {
  /**
   * 获取客户列表
   */
  getCustomers: (params: {
    pageNum?: number;
    pageSize?: number;
    name?: string;
    customerNo?: string;
  }) => {
    return apiClient.get<any>('/api/customer/list', { params });
  },

  /**
   * 创建客户
   */
  createCustomer: (data: any) => {
    return apiClient.post<any>('/api/customer/create', data);
  },

  /**
   * 获取客户详情
   */
  getDetail: (id: string) => {
    return apiClient.get<any>(`/api/customer/${id}`);
  }
};
