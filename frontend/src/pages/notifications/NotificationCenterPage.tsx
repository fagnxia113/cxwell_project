import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bell, CheckCircle2, Circle, Clock, MailOpen, ArrowRight, CheckCheck } from 'lucide-react'
import { apiClient } from '../../utils/apiClient'

const priorityColors: Record<string, string> = {
  'low': 'bg-gray-100 text-gray-700',
  'normal': 'bg-blue-100 text-blue-700',
  'high': 'bg-orange-100 text-orange-700',
  'urgent': 'bg-red-100 text-red-700'
}

interface NotificationItem {
  id: string
  title: string
  content: string
  type: string
  priority: string
  createTime: string
  isRead: boolean
  actionUrl?: string
  relatedId?: string
}

export default function NotificationCenterPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    loadNotifications()
    loadPendingCount()
  }, [unreadOnly])

  const loadPendingCount = async () => {
    try {
      const res = await apiClient.get<any>('/api/workflow/tasks/hub/todo/count').catch(() => null)
      if (res?.success) {
        setPendingCount(typeof res.data === 'number' ? res.data : (res.data?.count || 0))
      }
    } catch (error) {
      console.error('Load pending count failed:', error)
    }
  }

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get<any>('/api/notifications', {
        params: {
          is_read: unreadOnly ? 'false' : undefined,
          limit: 100
        }
      })
      if (res?.success) {
        setNotifications(res.data || [])
      }
    } catch (error) {
      console.error('Load notifications failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient.put<any>(`/api/notifications/${id}/read`).catch(() => null)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    } catch (error) {
      console.error('Mark as read failed:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.put('/api/notifications/mark-all-read').catch(() => null)
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (error) {
      console.error('Mark all as read failed:', error)
    }
  }

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id)
    }
    if (notification.actionUrl && notification.actionUrl !== '#') {
      window.location.href = notification.actionUrl
    } else if (notification.type === 'workflow' || notification.type?.startsWith('task_')) {
      navigate('/approvals/center')
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '-'
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return t('common.just_now')
    if (minutes < 60) return `${minutes}m ${t('common.ago')}`
    if (hours < 24) return `${hours}h ${t('common.ago')}`
    if (days < 7) return `${days}d ${t('common.ago')}`
    return date.toLocaleDateString()
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <Bell className="w-6 h-6 text-indigo-600" />
              {t('notification_center.title')}
            </h1>
            <p className="text-sm text-slate-500 mt-1">{t('notification_center.subtitle')}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setUnreadOnly(!unreadOnly)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
                unreadOnly
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Circle className={`w-3 h-3 ${!unreadOnly ? 'fill-slate-400' : ''}`} />
              {unreadOnly ? t('notification_center.view_all') : t('notification_center.only_unread')}
            </button>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                <CheckCheck className="w-3 h-3" />
                {t('notification_center.mark_all_read')}
              </button>
            )}
          </div>
        </div>

        {pendingCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-indigo-600 rounded-xl p-4 text-white flex items-center justify-between mb-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <ArrowRight className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">{t('notification_center.todo_hint', { count: pendingCount })}</span>
            </div>
            <button
              onClick={() => navigate('/approvals/center')}
              className="px-4 py-2 bg-white text-indigo-600 text-xs font-bold rounded-lg hover:bg-indigo-50 transition-colors"
            >
              {t('notification_center.go_to_approvals')}
            </button>
          </motion.div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs text-slate-400">{t('notification_center.syncing')}</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm text-slate-400">{t('notification_center.empty')}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((notification, idx) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-5 hover:bg-slate-50 cursor-pointer transition-all relative ${
                    !notification.isRead ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {!notification.isRead ? (
                        <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></div>
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-slate-300" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-sm font-semibold ${
                            !notification.isRead ? 'text-slate-900' : 'text-slate-600'
                          }`}>
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded">
                              {t('notification_center.new_alert')}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 whitespace-nowrap">
                          <Clock className="w-3 h-3" />
                          {formatDate(notification.createTime)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{notification.content}</p>
                    </div>
                  </div>

                  {!notification.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMarkAsRead(notification.id)
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 px-3 py-1.5 text-[11px] text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                      {t('notification_center.mark_read')}
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
