import React from 'react'
import { Bell, CheckCircle2, Circle, Clock, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { NotificationItem } from '../../hooks/useNotificationSystem'

interface NotificationPanelProps {
  notifications: NotificationItem[]
  unreadNotifCount: number
  totalUnreadCount: number
  pendingCount: number
  loading: boolean
  showDropdown: boolean
  setShowDropdown: (val: boolean) => void
  onMarkAsRead: (id: string, e: React.MouseEvent) => void
  formatTime: (time: string) => string
  t: any
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  notifications,
  unreadNotifCount,
  totalUnreadCount,
  pendingCount,
  loading,
  showDropdown,
  setShowDropdown,
  onMarkAsRead,
  formatTime,
  t
}) => {
  const navigate = useNavigate()

  const handleNotificationClick = (item: NotificationItem & { actionUrl?: string }) => {
    setShowDropdown(false)
    if (item.actionUrl && item.actionUrl !== '#') {
      window.location.href = item.actionUrl
    } else {
      navigate('/approvals/center')
    }
  }

  return (
    <div className="relative notif-dropdown">
      <button
        onClick={(e) => {
          e.stopPropagation()
          setShowDropdown(!showDropdown)
        }}
        className={`relative w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
          showDropdown
            ? 'bg-emerald-500 text-white'
            : 'bg-white border border-slate-200 text-slate-500 hover:text-emerald-500 hover:border-emerald-200'
        }`}
      >
        <Bell className="w-5 h-5" />
        {totalUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
            {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div
          className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">{t('notification.panel_title')}</h3>
            <span className="text-[10px] text-slate-400">
              {unreadNotifCount > 0 ? `${unreadNotifCount} ${t('notification.unread')}` : t('notification.all_read')}
            </span>
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-[10px] text-slate-400">{t('notification.loading')}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Circle className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400">{t('notification.empty')}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map(item => (
                  <div
                    key={item.id}
                    className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${
                      !item.isRead ? 'bg-blue-50/50' : ''
                    }`}
                    onClick={() => handleNotificationClick(item)}
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5">
                        {!item.isRead ? (
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`text-[13px] font-medium truncate pr-2 ${
                            !item.isRead ? 'text-slate-900 font-semibold' : 'text-slate-600'
                          }`}>
                            {t(item.title)}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{t(item.content)}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(item.createTime)}
                          </span>
                          {!item.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onMarkAsRead(item.id, e)
                              }}
                              className="text-[10px] text-emerald-500 hover:text-emerald-600 font-medium"
                            >
                              {t('notification.mark_read')}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
            <button
              onClick={() => {
                setShowDropdown(false)
                navigate('/approvals/center')
              }}
              className="w-full py-2.5 bg-white border border-emerald-500 text-emerald-600 text-xs font-bold rounded-lg hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
            >
              {t('notification.go_to_approvals')}
              {pendingCount > 0 && <span className="bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">{pendingCount}</span>}
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => {
                setShowDropdown(false)
                navigate('/notifications')
              }}
              className="w-full py-2.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-emerald-200"
            >
              {t('notification.view_all')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
