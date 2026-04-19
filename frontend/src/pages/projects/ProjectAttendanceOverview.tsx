import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Users, 
  Briefcase, 
  Plane, 
  Home,
  Info,
  Search
} from 'lucide-react'
import dayjs from 'dayjs'
import { apiClient } from '../../utils/apiClient'
import { cn } from '../../utils/cn'

interface ScheduleSegment {
  startDate: string
  endDate: string
  projectId: string | null
  type: 'work' | 'rest' | 'home_rest'
}

interface PersonnelSchedule {
  employeeId: string
  employeeName: string
  segments: ScheduleSegment[]
}

export default function ProjectAttendanceOverview() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(dayjs().format('YYYY-MM'))
  const [data, setData] = useState<PersonnelSchedule[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [projects, setProjects] = useState<{id: string, name: string}[]>([])

  // 生成该月份的所有天数
  const daysInMonth = dayjs(currentMonth).daysInMonth()
  const days = Array.from({ length: daysInMonth }, (_, i) => dayjs(currentMonth + '-' + (i + 1).toString().padStart(2, '0')))

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (selectedProjectId) {
      loadReport()
    }
  }, [currentMonth, selectedProjectId])

  const loadProjects = async () => {
    try {
      const res = await apiClient.get<any>('/api/projects', { params: { pageSize: 1000 } })
      const projs = res.data || res.items || []
      setProjects(projs)
      if (projs.length > 0) setSelectedProjectId(projs[0].id)
    } catch (e) {}
  }

  const loadReport = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get<any>(`/api/personnel/rotation/project-report/${selectedProjectId}/${currentMonth}`)
      if (res.success) {
        setData(res.data)
      }
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const getStatusForDay = (employee: PersonnelSchedule, date: dayjs.Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD')
    const segment = employee.segments.find(s => dateStr >= s.startDate && dateStr <= s.endDate)
    if (!segment) return 'none'
    return segment.type
  }

  const changeMonth = (delta: number) => {
    setCurrentMonth(dayjs(currentMonth).add(delta, 'month').format('YYYY-MM'))
  }

  const filteredData = data.filter(p => p.employeeName.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="min-h-screen bg-mesh p-4 lg:p-6 space-y-4 animate-fade-in custom-scrollbar">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-700 flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg text-white shadow-brand">
              <Users size={20} strokeWidth={2.5} />
            </div>
            {t('personnel.rotation.overview_title') || 'Expected Attendance Overview'}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('personnel.rotation.overview_subtitle') || 'Forward-looking availability based on Advance Reports.'}</p>
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
          
          <select 
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-xs font-bold text-primary shadow-sm outline-none focus:ring-2 ring-primary/10 transition-all"
          >
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <button className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-xl transition-all shadow-sm">
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* 状态图例 */}
      <div className="flex flex-wrap gap-6 px-6 py-4 bg-white/60 backdrop-blur-xl rounded-[24px] border border-white shadow-sm items-center">
        <LegendItem icon={<Briefcase size={14} />} label={t('personnel.rotation.on_duty')} color="bg-blue-500" />
        <LegendItem icon={<Plane size={14} />} label={t('personnel.rotation.home_rest')} color="bg-emerald-500" />
        <LegendItem icon={<Home size={14} />} label={t('personnel.rotation.local_rest')} color="bg-amber-500" />
        <LegendItem icon={<span className="text-[10px]">?</span>} label={t('personnel.rotation.not_reported')} color="bg-slate-100" />
        <div className="ml-auto flex items-center gap-2 text-[10px] font-bold text-slate-400">
          <Info size={14} className="text-blue-400" />
          {t('personnel.rotation.pm_hint')}
        </div>
      </div>

      {/* 搜索框 */}
      <div className="relative group max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
        <input 
          type="text" 
          placeholder={t('personnel.rotation.search_placeholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm outline-none focus:ring-4 ring-blue-500/10 transition-all text-sm font-bold"
        />
      </div>

      {/* 热力图看板 */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="sticky left-0 z-20 bg-slate-50/50 px-8 py-6 text-left border-r border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('personnel.rotation.personnel')}</span>
                </th>
                {days.map(day => (
                  <th key={day.format('D')} className={cn(
                    "px-2 py-6 text-center min-w-[40px] border-r border-slate-100/50",
                    day.day() === 0 || day.day() === 6 ? "bg-amber-50/30" : ""
                  )}>
                    <div className="text-[10px] font-black text-slate-400 mb-1">{day.format('ddd').toUpperCase()}</div>
                    <div className={cn(
                      "text-sm font-black",
                      day.isSame(dayjs(), 'day') ? "text-accent" : "text-primary"
                    )}>{day.format('D')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                   <td colSpan={daysInMonth + 1} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                        <span className="text-xs font-bold text-slate-400 italic">Aggregating schedule data...</span>
                      </div>
                   </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                   <td colSpan={daysInMonth + 1} className="py-24 text-center text-slate-300 font-black uppercase text-xs tracking-widest">
                     No personnel schedules found for this project
                   </td>
                </tr>
              ) : (
                filteredData.map(person => (
                  <tr key={person.employeeId} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50/50 px-8 py-5 border-r border-slate-100 shadow-[10px_0_15px_-10px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-[10px] text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                          {person.employeeName[0]}
                        </div>
                        <span className="text-sm font-bold text-primary truncate max-w-[120px]">{person.employeeName}</span>
                      </div>
                    </td>
                    {days.map(day => {
                      const status = getStatusForDay(person, day)
                      return (
                        <td key={day.format('D')} className="p-1 border-r border-slate-100/30">
                          <div className={cn(
                            "w-full h-8 rounded-md transition-all",
                            status === 'work' ? "bg-blue-500 shadow-lg shadow-blue-500/20" :
                            status === 'home_rest' ? "bg-emerald-500 shadow-lg shadow-emerald-500/20" :
                            status === 'rest' ? "bg-amber-500 shadow-lg shadow-amber-500/20" :
                            "bg-slate-50"
                          )} title={status !== 'none' ? `${person.employeeName} on ${day.format('YYYY-MM-DD')}: ${status}` : ''}></div>
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  )
}

function LegendItem({ icon, label, color }: { icon: any, label: string, color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("w-4 h-4 rounded-md flex items-center justify-center text-white", color)}>
        {icon}
      </div>
      <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">{label}</span>
    </div>
  )
}
