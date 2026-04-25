import React, { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import {
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  BarChart3
} from 'lucide-react'
import { apiClient } from '../../utils/apiClient'
import { useMessage } from '../../hooks/useMessage'
import { useTranslation } from 'react-i18next'
import { cn } from '../../utils/cn'

interface SummaryData {
  yearMonth: string
  totalDays: number
  employees: {
    employeeId: string
    name: string
    workedDays: number
    expectedDays: number
    absentDays: number
    attendanceRate: number
    projects: string[]
  }[]
}

interface CalendarData {
  yearMonth: string
  days: number[]
  employees: {
    employeeId: string
    name: string
    calendar: Record<string, {
      hasClockedIn: boolean
      checkInTime?: string
      checkOutTime?: string
      locationName?: string
      projectName: string
    }>
  }[]
}

type ViewMode = 'summary' | 'calendar'

export default function AttendanceBoardPage() {
  const { t } = useTranslation()
  const { success, error: showError } = useMessage()
  const [viewMode, setViewMode] = useState<ViewMode>('summary')
  const [currentMonth, setCurrentMonth] = useState(dayjs().format('YYYY-MM'))
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadData()
  }, [currentMonth, viewMode])

  const loadData = async () => {
    try {
      setLoading(true)
      if (viewMode === 'summary') {
        const res = await apiClient.get<SummaryData>(`/api/personnel/attendance/summary?year_month=${currentMonth}`)
        if (res && res.success && res.data) {
          setSummaryData(res.data)
        }
      } else {
        const res = await apiClient.get<CalendarData>(`/api/personnel/attendance/calendar?year_month=${currentMonth}`)
        if (res && res.success && res.data) {
          setCalendarData(res.data)
        }
      }
    } catch (err: any) {
      showError(t('personnel.attendance.load_failed') + ': ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSyncDingTalk = async () => {
    try {
      setSyncing(true)
      const res = await apiClient.post<any>('/api/personnel/attendance/sync/dingtalk', {})
      if (res.success) {
        success(t('personnel.attendance.sync_success', { count: res.count }))
        loadData()
      } else {
        showError(res.message || t('personnel.attendance.sync_failed'))
      }
    } catch (err: any) {
      showError(t('personnel.attendance.sync_failed') + ': ' + err.message)
    } finally {
      setSyncing(false)
    }
  }

  const filteredSummary = summaryData?.employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const filteredCalendar = calendarData?.employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const getWeekdayLabel = (day: number) => {
    const date = dayjs(`${currentMonth}-${String(day).padStart(2, '0')}`)
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[date.day()]
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-slate-900">{t('personnel.attendance.title')}</h1>
          <p className="text-xs text-slate-400 mt-1">{t('personnel.attendance.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncDingTalk}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? t('personnel.attendance.syncing') : t('personnel.attendance.sync_dingtalk')}
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
          <button
            onClick={() => setViewMode('summary')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5",
              viewMode === 'summary' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <BarChart3 size={12} />
            {t('personnel.attendance.view_mode.summary')}
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5",
              viewMode === 'calendar' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Calendar size={12} />
            {t('personnel.attendance.view_mode.calendar')}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={t('personnel.attendance.search_placeholder')}
              className="pl-9 pr-4 py-2 bg-white border border-slate-100 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none w-48"
            />
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-lg px-1 py-1">
            <button
              onClick={() => setCurrentMonth(dayjs(currentMonth).subtract(1, 'month').format('YYYY-MM'))}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={16} className="text-slate-400" />
            </button>
            <span className="text-sm font-black text-slate-900 min-w-[80px] text-center">
              {dayjs(currentMonth + '-01').format('YYYY') === dayjs().format('YYYY') 
                ? dayjs(currentMonth + '-01').format('MMMM')
                : dayjs(currentMonth + '-01').format('MMM YYYY')}
            </span>
            <button
              onClick={() => setCurrentMonth(dayjs(currentMonth).add(1, 'month').format('YYYY-MM'))}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronRight size={16} className="text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary View */}
      {viewMode === 'summary' && (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs font-bold text-slate-400 italic tracking-widest uppercase">{t('common.loading')}</div>
          ) : (
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('personnel.attendance.columns.employee')}</th>
                  <th className="px-4 py-3 text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('personnel.attendance.columns.worked_days')}</th>
                  <th className="px-4 py-3 text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('personnel.attendance.columns.expected_days')}</th>
                  <th className="px-4 py-3 text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('personnel.attendance.columns.attendance_rate')}</th>
                  <th className="px-4 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('personnel.attendance.columns.projects')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredSummary.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-xs font-bold text-slate-300 italic tracking-widest uppercase">{t('common.no_data')}</td>
                  </tr>
                ) : (
                  filteredSummary.map(emp => (
                    <tr key={emp.employeeId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black",
                            emp.workedDays > 0 ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                          )}>
                            {emp.name?.charAt(0) || '?'}
                          </div>
                          <span className="text-xs font-black text-slate-900">{emp.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          "text-sm font-black",
                          emp.workedDays > 0 ? "text-emerald-600" : "text-slate-300"
                        )}>
                          {emp.workedDays}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-black text-slate-400">{emp.expectedDays}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-1.5">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                emp.attendanceRate >= 80 ? "bg-emerald-500" :
                                emp.attendanceRate >= 50 ? "bg-amber-500" : "bg-rose-500"
                              )}
                              style={{ width: `${emp.attendanceRate}%` }}
                            />
                          </div>
                          <span className={cn(
                            "text-xs font-black",
                            emp.attendanceRate >= 80 ? "text-emerald-600" :
                            emp.attendanceRate >= 50 ? "text-amber-500" : "text-rose-500"
                          )}>
                            {emp.attendanceRate}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {emp.projects.length > 0 ? emp.projects.map((p, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded">
                              {p}
                            </span>
                          )) : <span className="text-slate-300 text-[10px]">-</span>}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs font-bold text-slate-400 italic tracking-widest uppercase">{t('common.loading')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/80">
                  <tr>
                    <th className="px-3 py-2 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] sticky left-0 bg-slate-50/80 z-10">{t('personnel.attendance.columns.employee')}</th>
                    {calendarData && calendarData.days.map(day => {
                      const date = dayjs(`${currentMonth}-${String(day).padStart(2, '0')}`);
                      const isWeekend = date.day() === 0 || date.day() === 6;
                      return (
                        <th key={day} className={cn(
                          "px-1 py-2 text-center text-[8px] font-black w-8",
                          isWeekend ? "text-rose-400" : "text-slate-400"
                        )}>
                          <div>{day}</div>
                          <div className="text-[7px] font-normal">{getWeekdayLabel(day)}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {!calendarData || filteredCalendar.length === 0 ? (
                    <tr>
                      <td colSpan={35} className="px-4 py-12 text-center text-xs font-bold text-slate-300 italic tracking-widest uppercase">{t('common.no_data')}</td>
                    </tr>
                  ) : (
                    filteredCalendar.map(emp => (
                      <tr key={emp.employeeId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-3 py-2 sticky left-0 bg-white z-10">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-black">
                              {emp.name?.charAt(0) || '?'}
                            </div>
                            <span className="text-[10px] font-black text-slate-700 whitespace-nowrap">{emp.name}</span>
                          </div>
                        </td>
                        {calendarData && calendarData.days.map(day => {
                          const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`
                          const date = dayjs(dateStr)
                          const record = emp.calendar[dateStr]
                          const isWeekend = date.day() === 0 || date.day() === 6

                          return (
                            <td key={day} className={cn(
                              "px-1 py-1 text-center",
                              isWeekend ? "bg-rose-50/30" : ""
                            )}>
                              {record?.hasClockedIn ? (
                                <div className="w-7 h-7 mx-auto rounded bg-emerald-500 text-white flex items-center justify-center text-[9px] font-black" title={record.projectName}>
                                  ●
                                </div>
                              ) : (
                                <div className="w-7 h-7 mx-auto rounded bg-slate-100 text-slate-300 flex items-center justify-center text-[9px]">
                                  -
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center gap-4 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-emerald-500 text-white flex items-center justify-center text-[9px]">●</span> {t('personnel.attendance.status.present')}</span>
            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-slate-100 text-slate-300 flex items-center justify-center">-</span> {t('personnel.attendance.status.absent')}</span>
          </div>
        </div>
      )}
    </div>
  )
}
