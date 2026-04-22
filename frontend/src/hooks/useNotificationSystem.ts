import { useState, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { apiClient } from '../utils/apiClient'

export interface NotificationItem {
  id: string
  title: string
  content: string
  type: string
  priority: string
  createTime: string
  isRead: boolean
}

export function useNotificationSystem() {
  const { t } = useTranslation()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadNotifCount, setUnreadNotifCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fetchingRef = useRef(false)

  const fetchCounts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const [countRes, pendingRes] = await Promise.all([
        apiClient.get<any>('/api/notifications/unread-count').catch(() => null),
        apiClient.get<any>('/api/workflow/tasks/hub/todo/count').catch(() => null)
      ])

      if (countRes?.success) {
        setUnreadNotifCount(countRes.data?.count || 0)
      }

      if (pendingRes?.success) {
        setPendingCount(typeof pendingRes.data === 'number' ? pendingRes.data : (pendingRes.data?.count || 0))
      }
    } catch (error) {
      console.error('Fetch counts failed:', error)
    }
  }, [])

  const fetchNotificationList = useCallback(async () => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    setLoading(true)
    try {
      const listRes = await apiClient.get<any>('/api/notifications?is_read=false&limit=5').catch(() => null)
      if (listRes?.success) {
        setNotifications(listRes.data || [])
      } else {
        setNotifications([])
      }
    } catch (error) {
      console.error('Fetch notification list failed:', error)
      setNotifications([])
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [])

  const fetchNotificationData = useCallback(async (fetchDetails = false) => {
    await fetchCounts()
    if (fetchDetails) {
      await fetchNotificationList()
    }
  }, [fetchCounts, fetchNotificationList])

  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    pollingRef.current = setInterval(() => {
      fetchCounts()
    }, 30000)
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [fetchCounts])

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
    if (isNaN(date.getTime())) return '-'
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
