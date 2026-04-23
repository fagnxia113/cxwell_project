// ============================================================
// 📦 项目详情页 - 团队 Tab
// 精简点：将主页面中关于项目人员展示、签证预警等逻辑（约 100 行）抽离
// ============================================================

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { 
  Users, Loader2, UserPlus, 
  ArrowRightLeft, Trash2, Search,
  ChevronLeft, ChevronRight, Briefcase
} from 'lucide-react'
import { useMessage } from '../../hooks/useMessage'
import { apiClient } from '../../utils/apiClient'
import { cn } from '../../utils/cn'
import type { ProjectPersonnel } from '../../types/project'
import ModalDialog from '../ModalDialog'

interface TeamTabProps {
  projectId: string
  personnel: ProjectPersonnel[]
  isAdmin?: boolean
  isProjectManager?: boolean
  onUpdatePermission?: (employeeId: string, canEdit: boolean) => void
  onAddPersonnel?: (data: { employeeId: string, transferInDate?: string }) => Promise<void>
  onTransferPersonnel?: (data: { employeeId: string, targetProjectId: string, transferDate: string, remark?: string }) => Promise<void>
  onRemovePersonnel?: (employeeId: string, data?: { transferOutDate?: string, remark?: string }) => Promise<void>
}

export default function TeamTab({
  projectId,
  personnel,
  isAdmin,
  isProjectManager,
  onUpdatePermission,
  onAddPersonnel,
  onTransferPersonnel,
  onRemovePersonnel
}: TeamTabProps) {
  const { t } = useTranslation()
  const { success, error: showError } = useMessage()
  const [syncing, setSyncing] = useState(false)
  const [activeView, setActiveView] = useState<'list' | 'schedule'>('list')
  
  // -- Schedule State --
  const [currentMonth, setCurrentMonth] = useState(dayjs().format('YYYY-MM'))
  const [scheduleData, setScheduleData] = useState<any[]>([])
  const [loadingSchedule, setLoadingSchedule] = useState(false)
  
  // -- Add Member State --
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [employees, setEmployees] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingEmployees, setLoadingEmployees] = useState(false)

  // -- Transfer State --
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [targetPersonnel, setTargetPersonnel] = useState<ProjectPersonnel | null>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [transferData, setTransferData] = useState({ targetProjectId: '', transferDate: new Date().toISOString().split('T')[0], remark: '' })
  const [loadingProjects, setLoadingProjects] = useState(false)

  const handleSyncAttendance = async () => {
    try {
      setSyncing(true)
      const res = await apiClient.post<any>('/api/attendance/sync/dingtalk')
      if (res?.success) {
        success(t('personnel.sync_success') || 'DingTalk attendance synced successfully')
      }
    } catch (err: any) {
      showError(err.message || 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true)
      const res = await apiClient.get<any>('/api/personnel/employees?limit=200')
      setEmployees(res?.data || res?.items || [])
    } catch (err) {
      showError('Failed to load employees')
    } finally {
      setLoadingEmployees(false)
    }
  }

  const loadProjects = async () => {
    try {
      setLoadingProjects(true)
      const res = await apiClient.get<any>('/api/projects?limit=200')
      setProjects(res?.data || res?.items || [])
    } catch (err) {
      showError('Failed to load projects')
    } finally {
      setLoadingProjects(false)
    }
  }

  useEffect(() => {
    if (activeView === 'schedule') {
      loadSchedule()
    }
  }, [activeView, currentMonth, projectId])

  const loadSchedule = async () => {
    try {
      setLoadingSchedule(true)
      const res = await apiClient.get<any>(`/api/personnel/rotation/project-report/${projectId}/${currentMonth}`)
      if (res.success) {
        setScheduleData(res.data)
      }
    } catch (e) {
      showError('Failed to load schedule')
    } finally {
      setLoadingSchedule(false)
    }
  }

  const getStatusForDay = (employee: any, date: dayjs.Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD')
    const segment = employee.segments.find((s: any) => dateStr >= s.startDate && dateStr <= s.endDate)
    if (!segment) return 'none'
    return segment.type
  }

  const changeMonth = (delta: number) => {
    setCurrentMonth(dayjs(currentMonth).add(delta, 'month').format('YYYY-MM'))
  }

  const daysInMonth = dayjs(currentMonth).daysInMonth()
  const days = Array.from({ length: daysInMonth }, (_, i) => dayjs(currentMonth + '-' + (i + 1).toString().padStart(2, '0')))

  const filteredEmployees = employees.filter(e => 
    !personnel.some(p => p.employee_id === e.id) && 
    (e.name?.toLowerCase().includes(searchQuery.toLowerCase()) || e.employee_no?.includes(searchQuery))
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
            <Users size={18} className="text-emerald-500" /> {t('project.tabs.team')}
          </h3>
          <button 
            onClick={handleSyncAttendance}
            disabled={syncing}
            className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black border border-emerald-100 hover:bg-emerald-100 transition-all disabled:opacity-50"
          >
            {syncing ? <Loader2 size={12} className="animate-spin" /> : <Users size={12} />} 
            {t('personnel.action.sync_attendance')}
          </button>
          
          <button
            onClick={() => {
              setIsAddModalOpen(true)
              loadEmployees()
            }}
            className="flex items-center gap-2 px-3 py-1 bg-emerald-500 text-white rounded-lg text-[10px] font-black hover:bg-emerald-600 transition-all shadow-sm"
            style={{ display: isProjectManager ? 'flex' : 'none' }}
          >
            <UserPlus size={12} /> {t('personnel.action.add_to_project')}
          </button>
        </div>
      </div>

      {/* 视图切换 */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        <button 
          onClick={() => setActiveView('list')}
          className={cn(
            "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
            activeView === 'list' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
          )}
        >
          {t('personnel.view_list')}
        </button>
        <button 
          onClick={() => setActiveView('schedule')}
          className={cn(
            "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
            activeView === 'schedule' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
          )}
        >
          {t('personnel.view_schedule')}
        </button>
      </div>

      {activeView === 'list' ? (
        <>
          {/* 人员列表网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personnel.map(p => (
              <div key={p.employee_id} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 -mr-12 -mt-12 rounded-full group-hover:scale-110 transition-transform opacity-50" />
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-emerald-400 font-black text-xl shadow-lg group-hover:bg-emerald-600 group-hover:text-white transition-all">
                      {p.employee_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="font-black text-base text-slate-900 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{p.employee_name}</div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{p.position}</div>
                    </div>
                  </div>
                  <div className="flex gap-1" style={{ display: isProjectManager ? 'flex' : 'none' }}>
                    <button
                      onClick={() => {
                        setTargetPersonnel(p)
                        setIsTransferModalOpen(true)
                        loadProjects()
                      }}
                      title="Transfer"
                      className="p-1.5 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <ArrowRightLeft size={14} />
                    </button>
                    <button
                      onClick={() => onRemovePersonnel?.(p.employee_id)}
                      title="Remove"
                      className="p-1.5 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-4 animate-in fade-in duration-500">
          {/* Schedule Controls */}
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
                <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-white rounded-md transition-colors">
                  <ChevronLeft size={16} className="text-slate-400" />
                </button>
                <span className="text-[10px] font-black text-slate-600 px-2 min-w-[80px] text-center">{dayjs(currentMonth).format('YYYY-MM')}</span>
                <button onClick={() => changeMonth(1)} className="p-1 hover:bg-white rounded-md transition-colors">
                  <ChevronRight size={16} className="text-slate-400" />
                </button>
              </div>
              
              <div className="hidden sm:flex gap-4 border-l border-slate-200 pl-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-blue-500"></div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('personnel.rotation.on_duty')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-emerald-500"></div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('personnel.rotation.home_rest')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-amber-500"></div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('personnel.rotation.local_rest')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
             <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="sticky left-0 z-10 bg-slate-50/50 px-4 py-3 text-left border-r border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('personnel.rotation.staff_column')}</span>
                      </th>
                      {days.map(day => (
                        <th key={`th-${day.format('YYYY-MM-DD')}`} className={cn(
                          "px-1 py-3 text-center min-w-[30px] border-r border-slate-100/50",
                          day.day() === 0 || day.day() === 6 ? "bg-amber-50/30" : ""
                        )}>
                          <div className="text-[8px] font-black text-slate-300 mb-0.5">{day.format('dd')}</div>
                          <div className={cn("text-[10px] font-black", day.isSame(dayjs(), 'day') ? "text-emerald-500" : "text-slate-600")}>{day.format('D')}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loadingSchedule ? (
                      <tr><td colSpan={daysInMonth + 1} className="py-10 text-center text-[10px] font-bold text-slate-400 italic tracking-widest uppercase">{t('personnel.rotation.loading')}</td></tr>
                    ) : scheduleData.length === 0 ? (
                      <tr><td colSpan={daysInMonth + 1} className="py-10 text-center text-[10px] font-bold text-slate-300 italic tracking-widest uppercase text-xs">{t('personnel.rotation.no_data')}</td></tr>
                    ) : (
                      scheduleData.map(person => (
                        <tr key={person.employeeId} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 px-4 py-3 border-r border-slate-100 shadow-[5px_0_10px_-5px_rgba(0,0,0,0.05)]">
                            <span className="text-xs font-black text-slate-700 truncate block max-w-[100px]">{person.employeeName}</span>
                          </td>
                          {days.map(day => {
                            const status = getStatusForDay(person, day)
                            return (
                              <td key={`td-${person.employeeId}-${day.format('YYYY-MM-DD')}`} className="p-0.5 border-r border-slate-100/30">
                                <div className={cn(
                                  "w-full h-6 rounded-sm transition-all",
                                  status === 'work' ? "bg-blue-500 shadow-sm" :
                                  status === 'home_rest' ? "bg-emerald-500 shadow-sm" :
                                  status === 'rest' ? "bg-amber-500 shadow-sm" :
                                  "bg-slate-50"
                                )}></div>
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
        </div>
      )}

      {/* Add Member Modal */}
      <ModalDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Personnel to Project"
        size="lg"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by name or number..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {loadingEmployees ? (
              <div className="py-10 text-center text-slate-400 text-xs">Loading employees...</div>
            ) : filteredEmployees.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">No matching employees found</div>
            ) : filteredEmployees.map(e => (
              <div key={e.employeeId} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-emerald-300 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 font-black group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    {e.name?.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-900">{e.name}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">{e.position} • {e.employee_no}</div>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    onAddPersonnel?.({ employeeId: e.employeeId })
                    setIsAddModalOpen(false)
                  }}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-black hover:bg-emerald-600 transition-all shadow-sm"
                >
                  {t('common.add')}
                </button>
              </div>
            ))}
          </div>
        </div>
      </ModalDialog>

      {/* Transfer Modal */}
      <ModalDialog
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title={`Transfer Personnel: ${targetPersonnel?.employee_name}`}
        footer={
          <>
            <button onClick={() => setIsTransferModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600">Cancel</button>
            <button 
              onClick={() => {
                if (targetPersonnel) {
                  onTransferPersonnel?.({
                    employeeId: targetPersonnel.employee_id,
                    targetProjectId: transferData.targetProjectId,
                    transferDate: transferData.transferDate,
                    remark: transferData.remark
                  })
                  setIsTransferModalOpen(false)
                }
              }}
              disabled={!transferData.targetProjectId}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-xs font-black shadow-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Transfer Now
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Target Project</label>
            <select 
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
              value={transferData.targetProjectId}
              onChange={(e) => setTransferData(p => ({ ...p, targetProjectId: e.target.value }))}
            >
              <option value="">Select a project...</option>
              {projects.map(pj => (
                <option key={pj.id} value={pj.id}>{pj.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Effective Date</label>
            <input 
              type="date"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
              value={transferData.transferDate}
              onChange={(e) => setTransferData(p => ({ ...p, transferDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Remark</label>
            <textarea 
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all h-20"
              value={transferData.remark}
              onChange={(e) => setTransferData(p => ({ ...p, remark: e.target.value }))}
              placeholder="Reason for transfer..."
            />
          </div>
        </div>
      </ModalDialog>
      {/* Styles for scrollbar */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}} />
    </div>
  )
}

