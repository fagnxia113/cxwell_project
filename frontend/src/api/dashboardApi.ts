import { apiClient } from '../utils/apiClient';

export const dashboardApi = {
  /**
   * 获取首页概览数据 (汇总指标、趋势图、状态分布)
   */
  getOverview: () => apiClient.get<any>('/api/dashboard/overview'),
};
