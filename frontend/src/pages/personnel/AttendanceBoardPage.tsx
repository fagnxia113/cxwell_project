import React, { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { API_URL } from '../../config/api'
import { apiClient } from '../../utils/apiClient'
import { useMessage } from '../../hooks/useMessage'
import { useTranslation } from 'react-i18next'
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Search, 
  Bell,
  RefreshCw,
  Projector
} from 'lucide-react'
import { cn } from '../../utils/cn'

interface AttendanceStatus {
  employeeId: string;
  name: string;
  projectName: string;
  hasClockedIn: boolean;
  checkInTime?: string;
  checkOutTime?: string;
  locationName?: string;
  hasDailyReport: boolean;
  status: 'normal' | 'missing_report' | 'absent';
}

export default function AttendanceBoardPage() {
  const { t } = useTranslation()
  const [data, setData] = useState<AttendanceStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [reminding, setReminding] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const { success, error: showError } = useMessage()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get<AttendanceStatus[]>('/api/personnel/attendance/board')
      if (res) {
        setData(Array.isArray(res) ? res : [])
      }
    } catch (err: any) {
      showError(t('personnel.error.load_failed') + ': ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRemindAll = async () => {
    try {
      setReminding(true)
      const res = await apiClient.post<any>('/api/personnel/attendance/remind', {})
      success(t('personnel.action.remind_success', { count: res.count || 0 }))
    } catch (err: any) {
      showError(t('common.error') + ': ' + err.message)
    } finally {
      setReminding(false)
    }
  }

  const handleSyncDingTalk = async () => {
    try {
      setSyncing(true)
      const res = await apiClient.post<any>('/api/personnel/attendance/sync/dingtalk', {})
      if (res.success) {
        success(t('personnel.action.sync_dingtalk') + ' ' + t('common.success'))
        fetchData()
      }
    } catch (err: any) {
      showError(t('common.error') + ': ' + err.message)
    } finally {
      setSyncing(false)
    }
  }

  const filteredData = data.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: data.length,
    normal: data.filter(i => i.status === 'normal').length,
    missing: data.filter(i => i.status === 'missing_report').length,
    absent: data.filter(i => i.status === 'absent').length
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-accent rounded-full animate-spin"></div>
        <p className="text-primary font-medium animate-pulse">{t('personnel.attendance.sync_hint')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-mesh p-4 lg:p-6 space-y-4 animate-fade-in custom-scrollbar">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-700 flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg text-white shadow-brand">
              <Users size={20} strokeWidth={2.5} />
            </div>
            {t('personnel.attendance.board_title')}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse shadow-[0_0_10px_rgba(0,204,121,0.5)]"></span>
            Real-time Personnel Presence & Report Compliance Tracker (Today: {new Date().toLocaleDateString()})
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleSyncDingTalk}
            disabled={syncing}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
            {syncing ? t('personnel.action.syncing') : t('personnel.action.sync_dingtalk')}
          </button>
          <button
            onClick={fetchData}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white border-2 border-slate-100 text-primary font-bold rounded-lg hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            {t('common.all')}
          </button>
          <button
            onClick={handleRemindAll}
            disabled={reminding || stats.missing === 0}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 btn-primary text-xs"
          >
            <Bell className="w-4 h-4" />
            {reminding ? t('personnel.action.updating') : t('personnel.action.one_click_remind')}
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Users className="w-6 h-6 text-primary" />}
          label={t('personnel.stats.on_attendance')}
          value={stats.total}
          color="bg-primary/10"
        />
        <StatCard
          icon={<CheckCircle2 className="w-6 h-6 text-accent" />}
          label={t('personnel.stats.today_normal')}
          value={stats.normal}
          color="bg-accent/10"
        />
        <StatCard
          icon={<AlertCircle className="w-6 h-6 text-amber-500" />}
          label={t('personnel.stats.pending_report')}
          value={stats.missing}
          color="bg-amber-50"
        />
        <StatCard 
          icon={<XCircle className="w-6 h-6 text-red-500" />} 
          label={t('personnel.stats.absent')} 
          value={stats.absent} 
          color="bg-red-50" 
        />
      </div>

      {/* 列表区域 */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-2xl shadow-slate-200/40 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder={t('personnel.attendance.search_placeholder')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-accent/30 outline-none transition-all font-medium text-primary"
            />
          </div>
          <div className="flex gap-2 p-1 bg-slate-50 rounded-xl">
             <button className="px-4 py-1.5 text-xs font-bold rounded-lg bg-primary text-white shadow-sm">{t('common.all')}</button>
             <button className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:text-primary">{t('personnel.attendance.exception_only')}</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">{t('personnel.fields.name')}</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">{t('personnel.attendance.daily_report')}</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-center">{t('personnel.attendance.clock_in')}</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-center">{t('personnel.attendance.daily_report')}</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">{t('common.status')} {t('common.remark')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-medium">
                    {t('personnel.empty.no_records')}
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.employeeId} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary font-bold group-hover:scale-110 transition-transform">
                          {item.name[0]}
                        </div>
                        <span className="font-bold text-primary">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-slate-600 font-bold">
                        <Projector className="w-4 h-4 opacity-40" />
                        {item.projectName}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <StatusBadge active={item.hasClockedIn} />
                        {item.checkInTime && (
                           <span className="text-[10px] font-bold text-slate-400">
                             {t('personnel.attendance.in_out', { in: item.checkInTime, out: item.checkOutTime || '--:--' })}
                           </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <StatusBadge active={item.hasDailyReport} />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col items-start gap-1">
                        <StatusDescription status={item.status} t={t} />
                        {item.locationName && (
                          <span className="text-[10px] font-bold text-secondary opacity-60 truncate max-w-[150px]" title={item.locationName}>
                            📍 {item.locationName}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-xl shadow-slate-200/20 flex items-center gap-5 group hover:-translate-y-1 transition-all">
      <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-bold text-primary mt-1">{value}</p>
      </div>
    </div>
  )
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <div className="flex justify-center">
      {active ? (
        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent shadow-inner">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-400 shadow-inner">
          <XCircle className="w-5 h-5" />
        </div>
      )}
    </div>
  )
}

function StatusDescription({ status, t }: { status: 'normal' | 'missing_report' | 'absent', t: any }) {
  const configs = {
    normal: { label: t('personnel.attendance.status_normal'), class: 'bg-accent/10 text-accent' },
    missing_report: { label: t('personnel.attendance.missing_report'), class: 'bg-amber-50 text-amber-600' },
    absent: { label: t('personnel.attendance.system_absent'), class: 'bg-red-50 text-red-500' }
  }
  
  const config = configs[status]
  
  return (
    <span className={`px-4 py-1.5 rounded-full text-xs font-black shadow-sm ${config.class}`}>
      {config.label}
    </span>
  )
}
