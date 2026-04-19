import { apiClient } from '../utils/apiClient';

export const systemApi = {
  // --- 用户管理 ---
  getUsers: () => apiClient.get<any>('/system/user/list'),
  createUser: (data: any) => apiClient.post<any>('/system/user', data),
  updateUser: (id: string, data: any) => apiClient.put<any>(`/system/user/${id}`, data),
  deleteUser: (id: string) => apiClient.delete<any>(`/system/user/${id}`),
  updateUserStatus: (id: string, status: string) => apiClient.patch<any>(`/system/user/${id}/status`, { status }),
  resetUserPassword: (id: string, newPassword: string) => apiClient.post<any>(`/system/user/${id}/reset-password`, { newPassword }),

  // --- 角色管理 ---
  getRoles: () => apiClient.get<any>('/system/role/list'),
  createRole: (data: any) => apiClient.post<any>('/system/role', data),
  updateRole: (id: string, data: any) => apiClient.put<any>(`/system/role/${id}`, data),
  deleteRole: (id: string) => apiClient.delete<any>(`/system/role/${id}`),
  getRoleMenuIds: (id: string) => apiClient.get<any>(`/system/role/${id}/menu-ids`),
  updateRolePermissions: (id: string, menuIds: string[]) => apiClient.post<any>(`/system/role/${id}/permissions`, { menuIds }),

  // --- 菜单管理 ---
  getMenuTree: () => apiClient.get<any>('/system/menu/treelist'),
  createMenu: (data: any) => apiClient.post<any>('/system/menu', data),
  updateMenu: (id: string, data: any) => apiClient.put<any>(`/system/menu/${id}`, data),
  deleteMenu: (id: string) => apiClient.delete<any>(`/system/menu/${id}`),
};
