import { apiClient } from '../utils/apiClient'

export interface User {
  id: string
  username: string
  name: string
  email: string
  role: string
  employee_id?: string
}

export interface LoginResponse {
  token: string
  user: User
}

export const authService = {
  async login(loginName: string, password: string): Promise<LoginResponse> {
    const res = await apiClient.post<any>('/api/auth/login', { loginName, password })
    return res.data
  },

  async verify(): Promise<User> {
    const res = await apiClient.get<any>('/api/auth/verify')
    return res.data
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const res = await apiClient.post<any>('/api/auth/change-password', { oldPassword, newPassword })
    return res.data
  }
}
