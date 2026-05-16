import React, { useState, useEffect, useMemo, useRef } from 'react'
import dayjs from 'dayjs'
import {
  Users, CheckCircle2, Search, RefreshCw, ChevronLeft, ChevronRight,
  Calendar, BarChart3, Activity as ActivityIcon, FileText, MapPin, Clock
} from 'lucide-react'
import { apiClient } from '../../utils/apiClient'
import { useMessage } from '../../hooks/useMessage'
import { useTranslation } from 'react-i18next'
import { cn } from '../../utils/cn'
import AttendanceTab from '../../components/projects/AttendanceTab'

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

type ViewMode = 'summary' | 'calendar' | 'records'

const PAGE_SIZE = 50

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
  const [page, setPage] = useState(0)

  useEffect(() => { loadData() }, [currentMonth])

  useEffect(() => { setPage(0) }, [searchTerm, viewMode])

  const loadData = async () => {
    try {
      setLoading(true)
      const [summaryRes, calendarRes] = await Promise.all([
        apiClient.get<any>(`/api/personnel/attendance/summary?year_month=${currentMonth}`).catch(() => null),
        apiClient.get<any>(`/api/personnel/attendance/calendar?year_month=${currentMonth}`).catch(() => null)
      ])
      if (summaryRes?.success && summaryRes.data) setSummaryData(summaryRes.data)
      if (calendarRes?.success && calendarRes.data) setCalendarData(calendarRes.data)
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

  const lowerSearch = searchTerm.toLowerCase()

  const filteredSummary = useMemo(() => {
    if (!summaryData) return []
    if (!searchTerm) return summaryData.employees
    return summaryData.employees.filter(emp => emp.name.toLowerCase().includes(lowerSearch))
  }, [summaryData, lowerSearch])

  const filteredCalendar = useMemo(() => {
    if (!calendarData) return []
    if (!searchTerm) return calendarData.employees
    return calendarData.employees.filter(emp => emp.name.toLowerCase().includes(lowerSearch))
  }, [calendarData, lowerSearch])

  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  const stats = useMemo(() => ({
    totalEmployees: summaryData?.employees.length || 0,
    averageRate: summaryData?.employees.length
      ? Math.round(summaryData.employees.reduce((acc, curr) => acc + curr.attendanceRate, 0) / summaryData.employees.length)
      : 0,
    totalWorked: summaryData?.employees.reduce((acc, curr) => acc + curr.workedDays, 0) || 0,
    totalExpected: summaryData?.employees.reduce((acc, curr) => acc + curr.expectedDays, 0) || 0
  }), [summaryData])

  const calendarPageData = useMemo(() => {
    const src = filteredCalendar
    return src.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  }, [filteredCalendar, page])

  const summaryPageData = useMemo(() => {
    const src = filteredSummary
    return src.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  }, [filteredSummary, page])

  const currentList = viewMode === 'calendar' ? filteredCalendar : filteredSummary
  const totalPages = Math.ceil(currentList.length / PAGE_SIZE)

  return (
    <div className="min-h-screen bg-mesh p-4 lg:p-6 space-y-4 animate-fade-in custom-scrollbar">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg text-white">
              <BarChart3 size={20} strokeWidth={2.5} />
            </div>
            {t('personnel.attendance.board_title')}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('personnel.attendance.subtitle')}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSyncDingTalk}
            disabled={syncing}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg shadow-sm transition-all text-sm font-medium flex items-center gap-2 hover:brightness-110 disabled:opacity-50"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? t('personnel.attendance.syncing') : t('personnel.attendance.sync_dingtalk')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title={t('personnel.stats.total')} value={stats.totalEmployees} icon={Users} color="blue" />
        <StatCard title={t('personnel.attendance.columns.attendance_rate')} value={`${stats.averageRate}%`} icon={CheckCircle2} color="emerald" />
        <StatCard title={t('personnel.attendance.columns.worked_days')} value={stats.totalWorked} icon={ActivityIcon} color="indigo" />
        <StatCard title={t('personnel.attendance.columns.expected_days')} value={stats.totalExpected} icon={Calendar} color="amber" />
      </div>

      <div className="premium-card p-4 bg-white/60 backdrop-blur-xl border-none flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('summary')}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2",
              viewMode === 'summary' ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <BarChart3 size={16} />
            {t('personnel.attendance.view_mode.summary')}
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2",
              viewMode === 'calendar' ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Calendar size={16} />
            {t('personnel.attendance.view_mode.calendar')}
          </button>
          <button
            onClick={() => setViewMode('records')}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2",
              viewMode === 'records' ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <FileText size={16} />
            {t('project.team.attendance_details') || 'Attendance Details'}
          </button>
        </div>

        <div className="flex-1 min-w-[200px] relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={14} />
          <input
            type="text"
            placeholder={t('personnel.attendance.search_placeholder')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input-standard pl-9 !py-2 text-sm bg-white/50 border-white focus:bg-white !rounded-lg w-full"
          />
        </div>

        <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-1">
          <button
            onClick={() => setCurrentMonth(dayjs(currentMonth).subtract(1, 'month').format('YYYY-MM'))}
            className="p-1.5 hover:bg-slate-50 rounded-md transition-all"
          >
            <ChevronLeft size={16} className="text-slate-400" />
          </button>
          <div className="px-3 min-w-[100px] text-center">
            <span className="text-xs font-bold text-slate-700">
              {dayjs(currentMonth + '-01').format('YYYY年MM月')}
            </span>
          </div>
          <button
            onClick={() => setCurrentMonth(dayjs(currentMonth).add(1, 'month').format('YYYY-MM'))}
            className="p-1.5 hover:bg-slate-50 rounded-md transition-all"
          >
            <ChevronRight size={16} className="text-slate-400" />
          </button>
        </div>

        {totalPages > 1 && viewMode !== 'records' && (
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all">
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-bold text-slate-500">{page + 1}/{totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all">
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-32 flex flex-col items-center gap-4 text-slate-300">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
            <p className="text-xs font-bold uppercase tracking-widest">{t('common.loading')}</p>
          </div>
        ) : (
          <>
            {viewMode === 'summary' ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-50 bg-slate-50/30">
                      <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('personnel.attendance.columns.employee')}</th>
                      <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('personnel.attendance.columns.worked_days')}({t('common.days') || '天'})</th>
                      <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('personnel.attendance.columns.expected_days')}({t('common.days') || '天'})</th>
                      <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('personnel.attendance.columns.attendance_rate')}</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('personnel.attendance.columns.projects')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {summaryPageData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center text-slate-300 font-bold uppercase tracking-widest italic">{t('common.no_data')}</td>
                      </tr>
                    ) : (
                      summaryPageData.map(emp => (
                        <tr key={emp.employeeId} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                {emp.name?.charAt(0)}
                              </div>
                              <span className="text-sm font-bold text-slate-800">{emp.name}</span>
                            </div>
                          </td>
                          <td className="px-8 py-4 text-center">
                            <span className="text-sm font-black text-slate-700">{emp.workedDays}</span>
                          </td>
                          <td className="px-8 py-4 text-center">
                            <span className="text-sm font-black text-slate-400">{emp.expectedDays}</span>
                          </td>
                          <td className="px-8 py-4">
                            <div className="flex items-center justify-center gap-3 max-w-[160px] mx-auto">
                              <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
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
                                "text-[10px] font-black min-w-[35px] text-right",
                                emp.attendanceRate >= 80 ? "text-emerald-600" :
                                emp.attendanceRate >= 50 ? "text-amber-500" : "text-rose-500"
                              )}>
                                {emp.attendanceRate}%
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-4">
                            <div className="flex flex-wrap gap-1.5">
                              {emp.projects.length > 0 ? emp.projects.map((p, i) => (
                                <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded border border-slate-200">
                                  {p}
                                </span>
                              )) : <span className="text-slate-300 text-[9px] italic uppercase tracking-widest">{t('personnel.rotation.not_assigned')}</span>}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : viewMode === 'calendar' ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest sticky left-0 bg-slate-50/50 z-10">{t('personnel.attendance.columns.employee')}</th>
                      {calendarData && calendarData.days.map(day => {
                        const date = dayjs(`${currentMonth}-${String(day).padStart(2, '0')}`);
                        const isWeekend = date.day() === 0 || date.day() === 6;
                        return (
                          <th key={day} className={cn(
                            "px-1 py-4 text-center min-w-[2.5rem]",
                            isWeekend ? "bg-rose-50/50" : ""
                          )}>
                            <div className={cn(
                              "text-[10px] font-black",
                              isWeekend ? "text-rose-400" : "text-slate-900"
                            )}>{day}</div>
                            <div className={cn(
                              "text-[8px] font-black opacity-50 uppercase",
                              isWeekend ? "text-rose-300" : "text-slate-400"
                            )}>{weekDays[date.day()]}</div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {!calendarData || calendarPageData.length === 0 ? (
                      <tr>
                        <td colSpan={35} className="px-8 py-20 text-center text-slate-300 font-bold uppercase tracking-widest italic">{t('common.no_data')}</td>
                      </tr>
                    ) : (
                      calendarPageData.map(emp => (
                        <tr key={emp.employeeId} className="group hover:bg-slate-50/30 transition-colors">
                          <td className="px-6 py-3 sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-50">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                                {emp.name?.charAt(0)}
                              </div>
                              <span className="text-xs font-bold text-slate-700 whitespace-nowrap">{emp.name}</span>
                            </div>
                          </td>
                          {calendarData && calendarData.days.map(day => {
                            const dateStr = `${currentMonth}-${String(day).padStart(2, '0')}`
                            const date = dayjs(dateStr)
                            const record = emp.calendar[dateStr]
                            const isWeekend = date.day() === 0 || date.day() === 6

                            const tooltipParts: string[] = []
                            if (record?.hasClockedIn) {
                              tooltipParts.push(record.projectName || '')
                              if (record.checkInTime) tooltipParts.push(`IN: ${dayjs(record.checkInTime).format('HH:mm')}`)
                              if (record.checkOutTime) tooltipParts.push(`OUT: ${dayjs(record.checkOutTime).format('HH:mm')}`)
                              if (record.locationName) tooltipParts.push(record.locationName)
                            }

                            return (
                              <td key={day} className={cn(
                                "px-1 py-3 text-center",
                                isWeekend ? "bg-rose-50/10" : ""
                              )}>
                                {record?.hasClockedIn ? (
                                  <div
                                    className="w-3 h-3 mx-auto rounded-full bg-emerald-500 shadow-sm transition-transform hover:scale-125 cursor-pointer"
                                    title={tooltipParts.join(' | ')}
                                  />
                                ) : (
                                  <div className="w-1 h-1 mx-auto rounded-full bg-slate-100" />
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
            ) : (
              <div className="p-0">
                <AttendanceTab month={currentMonth} />
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-6 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>{t('personnel.attendance.legend.present')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-200" />
          <span>{t('personnel.attendance.legend.absent')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-100 border border-rose-200" />
          <span>{t('personnel.attendance.legend.holiday')}</span>
        </div>
        <div className="ml-auto flex items-center gap-2 italic">
          <ActivityIcon size={14} />
          <span>{t('personnel.attendance.analysis_engine')}</span>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color }: any) {
  const colorConfig: Record<string, { bg: string; text: string }> = {
    emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600' },
    blue: { bg: 'bg-blue-500', text: 'text-blue-600' },
    indigo: { bg: 'bg-indigo-500', text: 'text-indigo-600' },
    amber: { bg: 'bg-amber-500', text: 'text-amber-600' }
  }
  const config = colorConfig[color] || colorConfig.blue

  return (
    <div className="bg-white p-6 rounded-lg border border-slate-100/80 shadow-sm relative overflow-hidden">
      <div className={cn("absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-[0.03]", config.bg)} />
      <div className="flex items-center gap-5 relative z-10">
        <div className={cn("p-4 rounded-2xl", config.bg)}>
          <Icon size={24} strokeWidth={2.5} className="text-white" />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1.5">{title}</p>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{value}</h3>
        </div>
      </div>
    </div>
  )
}
