import { apiClient } from '../utils/apiClient'

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  read: boolean
  created_at: string
  action_url?: string
  related_id?: string
}

export const notificationService = {
  async list(params?: { page?: number; pageSize?: number }): Promise<Notification[]> {
    try {
      const res = await apiClient.get<any>('/api/notifications', { params })
      if (Array.isArray(res)) return res
      if (res && Array.isArray(res.data)) return res.data
      return []
    } catch (e) {
      console.error('Failed to list notifications', e)
      return []
    }
  },

  async unreadCount(): Promise<number> {
    try {
      const res = await apiClient.get<any>('/api/notifications/unread-count')
      if (typeof res === 'number') return res
      if (res && res.data !== undefined) {
        return typeof res.data === 'number' ? res.data : (res.data?.count || 0)
      }
      return 0
    } catch (e) {
      console.error('Failed to get unread notifications count', e)
      return 0
    }
  },

  async markAsRead(id: string): Promise<void> {
    return apiClient.put(`/api/notifications/${id}/read`)
  },

  async markAllAsRead(): Promise<void> {
    return apiClient.put('/api/notifications/read-all')
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/api/notifications/${id}`)
  }
}
