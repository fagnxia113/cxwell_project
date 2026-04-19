import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Bell } from 'lucide-react'
import { API_URL } from '../../config/api'
import { useUser } from '../../contexts/UserContext'

interface Notification {
  id: string
  user_id: string
  user_name: string
  type: 'email' | 'sms' | 'push' | 'in_app' | 'workflow'
  title: string
  content: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  link: string
  is_read: number | boolean
  read_at: string
  created_at: string
}

const priorityColors: Record<string, string> = {
  'low': 'bg-gray-100 text-gray-700 border-gray-200',
  'normal': 'bg-blue-100 text-blue-700 border-blue-200',
  'high': 'bg-orange-100 text-orange-700 border-orange-200',
  'urgent': 'bg-red-100 text-red-700 border-red-200'
}

export default function NotificationCenterPage() {
  const { t, i18n } = useTranslation()
  const { user } = useUser()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)

  useEffect(() => {
    loadNotifications()
  }, [unreadOnly, typeFilter, user])

  const loadNotifications = async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      let url = `${API_URL.NOTIFICATIONS.LIST}?`
      if (unreadOnly) url += 'is_read=false&'
      if (typeFilter) url += `type=${typeFilter}&`
      
      const finalUrl = url.endsWith('&') ? url.slice(0, -1) : url.endsWith('?') ? url.slice(0, -1) : url

      const res = await fetch(finalUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.data || [])
      }
    } catch (error) {
      console.error(t('notification.load_failed'), error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    try {
      const token = localStorage.getItem('token')
      await fetch(API_URL.NOTIFICATIONS.MARK_READ(id), { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      loadNotifications()
    } catch (error) {
      console.error(t('notification.mark_read_failed'), error)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return
    try {
      const token = localStorage.getItem('token')
      await fetch(API_URL.NOTIFICATIONS.MARK_ALL_READ, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: user.id })
      })
      loadNotifications()
    } catch (error) {
      console.error(t('notification.mark_all_read_failed'), error)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id)
    }
    setSelectedNotification(notification)
    // Navigate to link if available
    if (notification.link && notification.link !== '#') {
      window.location.href = notification.link
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return t('common.just_now')
    if (minutes < 60) return t('notification_center.minutes_ago', { count: minutes })
    if (hours < 24) return t('notification_center.hours_ago', { count: hours })
    if (days < 7) return t('notification_center.days_ago', { count: days })
    return date.toLocaleDateString(i18n.resolvedLanguage || i18n.language)
  }

  return (
    <div className="min-h-screen bg-mesh p-4 lg:p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div>
          <h1 className="text-2xl font-bold text-slate-700 flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg text-white shadow-brand">
              <Bell size={20} strokeWidth={2.5} />
            </div>
            {t('notification_center.title')}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('notification_center.subtitle')}</p>
        </motion.div>

        <div className="flex gap-3">
          <button
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              unreadOnly
                ? 'bg-primary text-white shadow-brand'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {unreadOnly ? t('notification_center.view_all') : t('notification_center.only_unread')}
          </button>
          <button
            onClick={handleMarkAllAsRead}
            className="px-5 py-2.5 btn-secondary text-xs"
          >
            {t('notification_center.mark_all_read')}
          </button>
        </div>
      </div>

      <div className="premium-card p-4">
        <div className="flex border-b border-slate-50 p-3 gap-2 bg-slate-50/50 backdrop-blur-md">
          {[
            { id: '', label: t('notification_center.tabs.all') },
            { id: 'in_app', label: t('notification_center.tabs.in_app') },
            { id: 'workflow', label: t('notification_center.tabs.workflow') },
            { id: 'email', label: t('notification_center.tabs.email') },
            { id: 'sms', label: t('notification_center.tabs.sms') }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                typeFilter === tab.id 
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-100' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List Content */}
        <div className="flex-1">
          {loading ? (
            <div className="p-24 text-center">
              <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-6"></div>
              <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">{t('notification_center.syncing')}</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-24 text-center">
              <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-slate-100">
                <svg className="w-12 h-12 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.4em]">{t('notification_center.empty')}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-10 hover:bg-slate-50/50 transition-all cursor-pointer relative group ${
                    !notification.is_read ? 'bg-blue-50/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-10">
                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 duration-500 ${
                      notification.priority === 'urgent' ? 'bg-red-50 text-red-500' :
                      notification.priority === 'high' ? 'bg-orange-50 text-orange-500' :
                      'bg-blue-50 text-blue-500'
                    }`}>
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {notification.type === 'email' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        ) : notification.type === 'sms' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        )}
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-xl border ${priorityColors[notification.priority]}`}>
                            {t(`notification_center.priority.${notification.priority}`)}
                          </span>
                          {!notification.is_read && (
                            <span className="text-[9px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-1.5 bg-blue-50 px-2 py-0.5 rounded-lg">
                              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping"></span>
                              {t('notification_center.new_alert')}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{formatDate(notification.created_at)}</span>
                      </div>
                      <h3 className={`text-xl font-black tracking-tight mb-2 ${!notification.is_read ? 'text-slate-900 h-8 flex items-center' : 'text-slate-500 h-8 flex items-center'}`}>
                        {notification.title}
                      </h3>
                      <p className="text-sm font-medium text-slate-400 leading-relaxed max-w-2xl">{notification.content}</p>
                    </div>
                  </div>
                  
                  {/* Hover Actions */}
                  <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    {!notification.is_read && (
                      <button 
                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                        className="p-3 text-slate-300 hover:text-blue-500 hover:bg-white rounded-[1.25rem] shadow-2xl border border-slate-100 scale-90 group-hover:scale-100 duration-300"
                        title={t('notification_center.mark_read')}
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl flex items-center justify-center z-[100] p-6 animate-in fade-in duration-500">
           <div className="bg-white rounded-[4rem] shadow-2xl max-w-xl w-full overflow-hidden border border-white animate-in zoom-in-95 duration-500 scale-100">
             <div className="p-12">
               <div className="flex items-center gap-6 mb-10">
                 <div className="w-16 h-16 rounded-[2rem] bg-indigo-50 text-indigo-500 flex items-center justify-center shadow-inner">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                 </div>
                 <div>
                   <h2 className="text-2xl font-black text-slate-900 tracking-tighter">{selectedNotification.title}</h2>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-1 ml-0.5">{t('notification_center.detail_title')}</p>
                 </div>
               </div>
               
               <div className="relative mb-12">
                 <div className="absolute -left-6 top-0 bottom-0 w-1.5 bg-indigo-100 rounded-full"></div>
                 <div className="text-slate-600 text-base font-bold leading-loose whitespace-pre-wrap pl-2 h-auto max-h-[300px] overflow-y-auto custom-scrollbar">
                   {selectedNotification.content}
                 </div>
               </div>

               <div className="flex gap-4">
                 <button 
                   onClick={() => setSelectedNotification(null)}
                   className="flex-1 py-5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-[2rem] hover:bg-slate-800 transition-all shadow-2xl shadow-slate-300"
                 >
                   {t('notification_center.confirm_dismiss')}
                 </button>
               </div>
             </div>
           </div>
        </div>
      )}
    </div>
  )
}
