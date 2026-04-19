import React from 'react'
import { Bell } from 'lucide-react'
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

  return (
    <div className="relative notif-dropdown">
      <button 
        onClick={(e) => {
          e.stopPropagation()
          setShowDropdown(!showDropdown)
        }}
        className={`relative w-11 h-11 flex items-center justify-center rounded-xl border transition-all shadow-sm ${
          showDropdown 
            ? 'bg-emerald-600 border-emerald-600 text-white' 
            : 'bg-white border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50'
        }`}
      >
        <Bell className="w-6 h-6" />
        {totalUnreadCount > 0 && (
          <span className={`absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black border-2 border-white shadow-lg ${
            showDropdown ? 'bg-orange-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {showDropdown && (
        <div 
          className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-xl shadow-2xl shadow-slate-200 border border-slate-200/60 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right z-50 text-left"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">{t('notification.unread_title')}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{t('notification.panel_title')}</p>
            </div>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-black rounded-lg">
              {unreadNotifCount} {t('notification.new_messages')}
            </span>
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-10 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                <div className="text-[10px] text-slate-400 font-black uppercase">{t('notification.loading')}</div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <Bell className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-xs text-slate-400 font-black uppercase tracking-widest">{t('notification.empty')}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map(item => (
                  <div 
                    key={item.id}
                    className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group relative"
                    onClick={() => {
                      setShowDropdown(false);
                      navigate('/notifications');
                    }}
                  >
                    <div className="flex gap-4">
                      <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${
                        item.priority === 'urgent' ? 'bg-red-500' : 
                        item.priority === 'high' ? 'bg-orange-500' : 'bg-blue-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-[13px] font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate pr-8">{item.title}</h4>
                          <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap">{formatTime(item.created_at)}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed font-medium">{item.content}</p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => onMarkAsRead(item.id, e)}
                      className="absolute top-4 right-4 p-1 text-slate-200 hover:text-blue-500 hover:bg-white rounded shadow-sm opacity-0 group-hover:opacity-100 transition-all border border-slate-100"
                      title={t('notification.mark_read')}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 bg-white grid grid-cols-2 gap-4">
            <button 
              onClick={() => {
                setShowDropdown(false);
                navigate('/notifications');
              }}
              className="w-full py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-colors shadow-xl shadow-slate-200"
            >
              {t('notification.view_all')}
            </button>
            <button 
              onClick={() => {
                setShowDropdown(false);
                navigate('/approvals/pending');
              }}
              className="w-full py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-colors shadow-xl shadow-blue-100"
            >
              {t('notification.go_to_pending')} {pendingCount > 0 && `(${pendingCount})`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
