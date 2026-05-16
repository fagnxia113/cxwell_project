import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChevronLeft, ChevronRight, Download, Users, Briefcase, Coffee,
  Search, Filter, Plane, Home, Heart, Stethoscope, Flag, Ban,
  CalendarDays
} from 'lucide-react'
import dayjs from 'dayjs'
import { apiClient } from '../../utils/apiClient'
import { cn } from '../../utils/cn'

type RotationType = 'work' | 'rest' | 'home_rest' | 'annual_leave' | 'medical_leave'
  | 'public_holiday' | 'unpaid_leave'

type ViewMode = 'all' | 'work' | 'leave'

interface ScheduleSegment {
  startDate: string
  endDate: string
  projectId: string | null
  type: RotationType
}

interface PersonnelSchedule {
  employeeId: string
  employeeName: string
  position?: string
  deptId?: string
  segments: ScheduleSegment[]
}

interface ProjectInfo {
  id: string
  name: string
}

interface CellInfo {
  type: RotationType | 'none'
  projectId: string | null
  title: string
}

const WORK_TYPES = new Set<string>(['work'])
const LEAVE_TYPES = new Set<string>([
  'rest', 'home_rest', 'annual_leave', 'medical_leave',
  'public_holiday', 'unpaid_leave'
])

const LEAVE_COLORS: Record<string, string> = {
  home_rest: 'bg-emerald-400',
  rest: 'bg-amber-400',
  annual_leave: 'bg-rose-400',
  medical_leave: 'bg-orange-400',
  public_holiday: 'bg-violet-400',
  unpaid_leave: 'bg-slate-400',
}

const PAGE_SIZE = 50

function buildCellMatrix(
  personnel: PersonnelSchedule[],
  days: string[],
  projectMap: Record<string, string>,
  t: any
): Map<string, CellInfo[]> {
  const matrix = new Map<string, CellInfo[]>()
  for (const person of personnel) {
    const row: CellInfo[] = []
    for (const dateStr of days) {
      const segment = person.segments.find(s => dateStr >= s.startDate && dateStr <= s.endDate)
      if (!segment) {
        row.push({ type: 'none', projectId: null, title: '' })
        continue
      }
      const projName = segment.projectId ? (projectMap[segment.projectId] || '') : ''
      const typeLabel = WORK_TYPES.has(segment.type)
        ? t('personnel.rotation.types.work')
        : t(`personnel.rotation.types.${segment.type}`)
      row.push({
        type: segment.type,
        projectId: segment.projectId,
        title: `${person.employeeName} ${dateStr}: ${typeLabel}${projName ? ' - ' + projName : ''}`
      })
    }
    matrix.set(person.employeeId, row)
  }
  return matrix
}

function getCellBg(cell: CellInfo, viewMode: ViewMode, filterProjectId: string, filterLeaveType: string): string {
  const isWork = WORK_TYPES.has(cell.type)
  const isLeave = LEAVE_TYPES.has(cell.type)
  const isNone = cell.type === 'none'

  if (viewMode === 'all') {
    if (isWork) return 'bg-blue-500'
    if (isLeave) return 'bg-amber-400'
    return 'bg-slate-50'
  }

  if (viewMode === 'work') {
    if (isWork) {
      if (filterProjectId === 'all') return 'bg-blue-500'
      return cell.projectId === filterProjectId ? 'bg-blue-500' : 'bg-blue-200'
    }
    if (isLeave) return 'bg-amber-100'
    return 'bg-slate-50'
  }

  if (viewMode === 'leave') {
    if (isLeave) {
      const color = LEAVE_COLORS[cell.type] || 'bg-amber-400'
      if (filterLeaveType === 'all') return color
      return cell.type === filterLeaveType ? color : 'bg-slate-200'
    }
    if (isWork) return 'bg-blue-100'
    return 'bg-slate-50'
  }

  return 'bg-slate-50'
}

export default function AllRotationPlanPage() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(dayjs().format('YYYY-MM'))
  const [data, setData] = useState<PersonnelSchedule[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [projectMap, setProjectMap] = useState<Record<string, string>>({})
  const [projects, setProjects] = useState<ProjectInfo[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [filterProjectId, setFilterProjectId] = useState<string>('all')
  const [filterLeaveType, setFilterLeaveType] = useState<string>('all')
  const [page, setPage] = useState(0)

  const daysInMonth = dayjs(currentMonth).daysInMonth()
  const dayStrings = useMemo(() =>
    Array.from({ length: daysInMonth }, (_, i) => {
      const d = (i + 1).toString().padStart(2, '0')
      return `${currentMonth}-${d}`
    }),
    [currentMonth, daysInMonth]
  )

  const today = dayjs().format('YYYY-MM-DD')

  useEffect(() => { loadProjects() }, [])
  useEffect(() => { loadReport() }, [currentMonth])
  useEffect(() => { setPage(0) }, [searchTerm, viewMode, filterProjectId, filterLeaveType])

  const loadProjects = async () => {
    try {
      const res = await apiClient.get<any>('/api/project/list', { params: { pageSize: 1000 } })
      const projs = res?.data?.list || res?.data || []
      const map: Record<string, string> = {}
      projs.forEach((p: any) => { map[p.id] = p.name })
      setProjectMap(map)
      setProjects(projs.map((p: any) => ({ id: p.id, name: p.name })))
    } catch (e) {}
  }

  const loadReport = async () => {
    try {
      setLoading(true)
      const yearMonth = currentMonth.replace('-', '')
      const res = await apiClient.get<any>(`/api/personnel/rotation/all-plans/${yearMonth}`)
      if (res && res.success) {
        setData(res.data || [])
      }
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const changeMonth = (delta: number) => {
    setCurrentMonth(dayjs(currentMonth).add(delta, 'month').format('YYYY-MM'))
  }

  const lowerSearch = searchTerm.toLowerCase()

  const filteredData = useMemo(() => {
    return data.filter(p => {
      const matchSearch = !searchTerm || p.employeeName.toLowerCase().includes(lowerSearch)
      if (filterProjectId !== 'all') {
        const matchProject = p.segments.some(s => s.projectId === filterProjectId)
        if (!matchProject) return false
      }
      return matchSearch
    })
  }, [data, lowerSearch, filterProjectId])

  const stats = useMemo(() => ({
    total: data.length,
    working: data.filter(p => p.segments.some(s => s.type === 'work' && today >= s.startDate && today <= s.endDate)).length,
    onLeave: data.filter(p => p.segments.some(s => LEAVE_TYPES.has(s.type) && today >= s.startDate && today <= s.endDate)).length,
    notReported: data.filter(p => p.segments.length === 0).length,
  }), [data, today])

  const cellMatrix = useMemo(() =>
    buildCellMatrix(filteredData, dayStrings, projectMap, t),
    [filteredData, dayStrings, projectMap, t]
  )

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE)
  const pageData = useMemo(() =>
    filteredData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [filteredData, page]
  )

  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  const leaveTypeOptions = useMemo(() => {
    const types = Array.from(LEAVE_TYPES)
    return types.map(type => ({
      value: type,
      label: t(`personnel.rotation.types.${type}`),
      color: LEAVE_COLORS[type]
    }))
  }, [t])

  return (
    <div className="min-h-screen bg-mesh p-4 lg:p-6 space-y-4 animate-fade-in custom-scrollbar">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-700 flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg text-white shadow-brand">
              <Users size={20} strokeWidth={2.5} />
            </div>
            {t('personnel.rotation.all_plans_title')}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('personnel.rotation.all_plans_subtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-slate-100">
            <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
              <ChevronLeft size={18} className="text-slate-400" />
            </button>
            <span className="text-xs font-bold text-primary px-2 min-w-[100px] text-center">{dayjs(currentMonth).format('MMMM YYYY')}</span>
            <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
              <ChevronRight size={18} className="text-slate-400" />
            </button>
          </div>
          <button className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-xl transition-all shadow-sm">
            <Download size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label={t('personnel.rotation.stat_total')} value={stats.total} color="text-slate-600" />
        <StatCard label={t('personnel.rotation.stat_working')} value={stats.working} color="text-blue-600" />
        <StatCard label={t('personnel.rotation.stat_on_leave')} value={stats.onLeave} color="text-amber-600" />
        <StatCard label={t('personnel.rotation.stat_not_reported')} value={stats.notReported} color="text-slate-400" />
      </div>

      <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {([
              { key: 'all', label: t('personnel.rotation.view_all'), icon: CalendarDays },
              { key: 'work', label: t('personnel.rotation.view_work'), icon: Briefcase },
              { key: 'leave', label: t('personnel.rotation.view_leave'), icon: Coffee },
            ] as const).map(mode => (
              <button
                key={mode.key}
                onClick={() => { setViewMode(mode.key); setFilterProjectId('all'); setFilterLeaveType('all') }}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
                  viewMode === mode.key
                    ? "bg-white text-primary shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <mode.icon size={14} />
                {mode.label}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-slate-200" />

          <div className={cn(
            "flex items-center gap-2 transition-opacity",
            viewMode === 'work' ? "opacity-100" : "opacity-40 pointer-events-none"
          )}>
            <Filter size={12} className="text-slate-400" />
            <select
              value={filterProjectId}
              onChange={(e) => setFilterProjectId(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-primary shadow-sm outline-none"
            >
              <option value="all">{t('personnel.rotation.all_projects')}</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className={cn(
            "flex items-center gap-2 transition-opacity",
            viewMode === 'leave' ? "opacity-100" : "opacity-40 pointer-events-none"
          )}>
            <Filter size={12} className="text-slate-400" />
            <select
              value={filterLeaveType}
              onChange={(e) => setFilterLeaveType(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-primary shadow-sm outline-none"
            >
              <option value="all">{t('personnel.rotation.all_leave_types')}</option>
              {leaveTypeOptions.map(lt => (
                <option key={lt.value} value={lt.value}>{lt.label}</option>
              ))}
            </select>
          </div>

          <div className="ml-auto">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={14} />
              <input
                type="text"
                placeholder={t('personnel.rotation.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 bg-white border border-slate-100 rounded-xl shadow-sm outline-none focus:ring-2 ring-blue-500/10 transition-all text-xs font-bold w-[200px]"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {viewMode === 'all' && (
            <>
              <LegendDot color="bg-blue-500" label={t('personnel.rotation.on_duty')} />
              <LegendDot color="bg-amber-400" label={t('personnel.rotation.leave')} />
              <LegendDot color="bg-slate-100 border border-slate-200" label={t('personnel.rotation.not_reported')} />
            </>
          )}
          {viewMode === 'work' && (
            <>
              <LegendDot color="bg-blue-500" label={
                filterProjectId === 'all'
                  ? t('personnel.rotation.on_duty')
                  : projectMap[filterProjectId] || t('personnel.rotation.on_duty')
              } />
              <LegendDot color="bg-blue-200" label={t('personnel.rotation.other_projects')} />
              <LegendDot color="bg-amber-100" label={t('personnel.rotation.leave_dimmed')} />
            </>
          )}
          {viewMode === 'leave' && (
            <>
              {leaveTypeOptions.map(lt => {
                const isDimmed = filterLeaveType !== 'all' && lt.value !== filterLeaveType
                return (
                  <LegendDot
                    key={lt.value}
                    color={isDimmed ? 'bg-slate-200' : lt.color}
                    label={lt.label}
                    dimmed={isDimmed}
                  />
                )
              })}
              <LegendDot color="bg-blue-100" label={t('personnel.rotation.work_dimmed')} />
            </>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-bold text-slate-500">{page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all"
          >
            <ChevronRight size={14} />
          </button>
          <span className="text-[10px] text-slate-400">
            {t('personnel.rotation.showing_range', { from: page * PAGE_SIZE + 1, to: Math.min((page + 1) * PAGE_SIZE, filteredData.length), total: filteredData.length })}
          </span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="sticky left-0 z-20 bg-slate-50/50 px-6 py-4 text-left border-r border-slate-100 min-w-[140px]">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('personnel.rotation.personnel')}</span>
                </th>
                {dayStrings.map((ds, i) => {
                  const d = dayjs(ds)
                  const isWeekend = d.day() === 0 || d.day() === 6
                  return (
                    <th key={ds} className={cn(
                      "px-1 py-4 text-center min-w-[36px] border-r border-slate-100/50",
                      isWeekend ? "bg-amber-50/30" : ""
                    )}>
                      <div className="text-[9px] font-black text-slate-400 mb-0.5">{weekDays[d.day()]}</div>
                      <div className={cn(
                        "text-xs font-black",
                        ds === today ? "text-accent" : "text-primary"
                      )}>{i + 1}</div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={daysInMonth + 1} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-3 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                      <span className="text-xs font-bold text-slate-400">{t('personnel.rotation.loading_data')}</span>
                    </div>
                  </td>
                </tr>
              ) : pageData.length === 0 ? (
                <tr>
                  <td colSpan={daysInMonth + 1} className="py-20 text-center text-slate-300 font-bold text-xs">
                    {t('personnel.rotation.no_data')}
                  </td>
                </tr>
              ) : (
                pageData.map(person => {
                  const cells = cellMatrix.get(person.employeeId)
                  return (
                    <tr key={person.employeeId} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50/50 px-6 py-3 border-r border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center font-black text-[9px] text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            {person.employeeName[0]}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-primary truncate max-w-[100px] block">{person.employeeName}</span>
                            {person.position && <span className="text-[8px] text-slate-400">{person.position}</span>}
                          </div>
                        </div>
                      </td>
                      {cells ? cells.map((cell, i) => {
                        const bg = getCellBg(cell, viewMode, filterProjectId, filterLeaveType)
                        return (
                          <td key={i} className="p-0.5 border-r border-slate-100/30">
                            <div
                              className={cn("w-full h-7 rounded cell-hover", bg)}
                              title={cell.title || t('personnel.rotation.not_reported')}
                            />
                          </td>
                        )
                      }) : (
                        dayStrings.map((_, i) => (
                          <td key={i} className="p-0.5 border-r border-slate-100/30">
                            <div className="w-full h-7 rounded bg-slate-50" title={t('personnel.rotation.not_reported')}></div>
                          </td>
                        ))
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .cell-hover { transition: transform 0.1s; }
        .cell-hover:hover { transform: scale(1.2); z-index: 10; position: relative; }
      `}} />
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</div>
      <div className={cn("text-2xl font-black tabular-nums", color)}>{value}</div>
    </div>
  )
}

function LegendDot({ color, label, dimmed }: { color: string; label: string; dimmed?: boolean }) {
  return (
    <div className={cn("flex items-center gap-1.5", dimmed && "opacity-40")}>
      <div className={cn("w-3 h-3 rounded-sm flex-shrink-0", color)} />
      <span className={cn("text-[10px] font-bold", dimmed ? "text-slate-300 line-through" : "text-slate-500")}>{label}</span>
    </div>
  )
}
