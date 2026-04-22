import { apiClient } from '../utils/apiClient';

export const systemApi = {
  getUsers: () => apiClient.get<any>('/api/system/user/list'),
  createUser: (data: any) => apiClient.post<any>('/api/system/user', data),
  updateUser: (id: string, data: any) => apiClient.put<any>(`/api/system/user/${id}`, data),
  deleteUser: (id: string) => apiClient.delete<any>(`/api/system/user/${id}`),
  updateUserStatus: (id: string, status: string) => apiClient.patch<any>(`/api/system/user/${id}/status`, { status }),
  resetUserPassword: (id: string, newPassword: string) => apiClient.post<any>(`/api/system/user/${id}/reset-password`, { newPassword }),

  getRoles: () => apiClient.get<any>('/api/system/role/list'),
  createRole: (data: any) => apiClient.post<any>('/api/system/role', data),
  updateRole: (id: string, data: any) => apiClient.put<any>(`/api/system/role/${id}`, data),
  deleteRole: (id: string) => apiClient.delete<any>(`/api/system/role/${id}`),
  getRoleMenuIds: (id: string) => apiClient.get<any>(`/api/system/role/${id}/menu-ids`),
  updateRolePermissions: (id: string, menuIds: string[]) => apiClient.post<any>(`/api/system/role/${id}/permissions`, { menuIds }),

  getMenuTree: () => apiClient.get<any>('/api/system/menu/treelist'),
  createMenu: (data: any) => apiClient.post<any>('/api/system/menu', data),
  updateMenu: (id: string, data: any) => apiClient.put<any>(`/api/system/menu/${id}`, data),
  deleteMenu: (id: string) => apiClient.delete<any>(`/api/system/menu/${id}`),
};
