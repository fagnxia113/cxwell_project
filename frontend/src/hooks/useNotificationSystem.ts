import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { apiClient } from '../utils/apiClient'

export interface NotificationItem {
  id: string
  title: string
  content: string
  type: string
  priority: string
  created_at: string
  is_read: boolean
}

export function useNotificationSystem() {
  const { t } = useTranslation()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadNotifCount, setUnreadNotifCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchNotificationData = useCallback(async (fetchDetails = false) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      // 1. Unread count
      const countRes = await apiClient.get<any>('/api/notifications/unread-count').catch(() => null)
      if (countRes?.success) {
        setUnreadNotifCount(countRes.data.count || 0)
      }

      // 2. Pending tasks count
      const pendingRes = await apiClient.get<any>('/api/workflow/my-pending-tasks/count').catch(() => null)
      if (pendingRes?.data !== undefined) {
        setPendingCount(typeof pendingRes.data === 'number' ? pendingRes.data : (pendingRes.data?.count || 0))
      }

      // 3. Details for dropdown
      if (fetchDetails) {
        setLoading(true)
        const listRes = await apiClient.get<any>('/api/notifications?is_read=false&limit=5').catch(() => null)
        if (listRes?.success) {
          setNotifications(listRes.data || [])
        }
        setLoading(false)
      }
    } catch (error) {
      console.error('Fetch notifications failed:', error)
    }
  }, [])

  const markAsRead = async (id: string) => {
    try {
      const res = await apiClient.put<any>(`/api/notifications/${id}/read`)
      if (res?.success) {
        setNotifications(prev => prev.filter(n => n.id !== id))
        setUnreadNotifCount(prev => Math.max(0, prev - 1))
        return true
      }
    } catch (error) {
      console.error('Mark as read failed:', error)
    }
    return false
  }

  const formatNotifTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return t('common.just_now')
    if (minutes < 60) return `${minutes}m ${t('common.ago')}`
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ${t('common.ago')}`
    return date.toISOString().split('T')[0]
  }

  return {
    notifications,
    unreadNotifCount,
    pendingCount,
    totalUnreadCount: unreadNotifCount + pendingCount,
    loading,
    fetchNotificationData,
    markAsRead,
    formatNotifTime
  }
}
