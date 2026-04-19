// ============================================================
// 📦 项目详情页 - 团队 Tab
// 精简点：将主页面中关于项目人员展示、签证预警等逻辑（约 100 行）抽离
// ============================================================

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, Activity, ShieldCheck, Loader2, UserPlus, ArrowRightLeft, Trash2, Search, Calendar } from 'lucide-react'
import { useMessage } from '../../hooks/useMessage'
import { apiClient } from '../../utils/apiClient'
import { cn } from '../../utils/cn'
import type { ProjectPersonnel } from '../../types/project'
import ModalDialog from '../ModalDialog'

interface TeamTabProps {
  personnel: ProjectPersonnel[]
  isAdmin?: boolean
  onUpdatePermission?: (employeeId: string, canEdit: boolean) => void
  onAddPersonnel?: (data: { employeeId: string, transferInDate?: string }) => Promise<void>
  onTransferPersonnel?: (data: { employeeId: string, targetProjectId: string, transferDate: string, remark?: string }) => Promise<void>
  onRemovePersonnel?: (employeeId: string, data?: { transferOutDate?: string, remark?: string }) => Promise<void>
}

export default function TeamTab({ 
  personnel, 
  isAdmin, 
  onUpdatePermission,
  onAddPersonnel,
  onTransferPersonnel,
  onRemovePersonnel
}: TeamTabProps) {
  const { t } = useTranslation()
  const { success, error: showError } = useMessage()
  const [syncing, setSyncing] = useState(false)
  
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
            {syncing ? <Loader2 size={12} className="animate-spin" /> : <Activity size={12} />} 
            {t('personnel.action.sync_attendance') || 'Sync Attendance'}
          </button>
          
          <button 
            onClick={() => {
              setIsAddModalOpen(true)
              loadEmployees()
            }}
            className="flex items-center gap-2 px-3 py-1 bg-emerald-500 text-white rounded-lg text-[10px] font-black hover:bg-emerald-600 transition-all shadow-sm"
          >
            <UserPlus size={12} /> {t('personnel.action.add_to_project') || 'Add Member'}
          </button>
        </div>
      </div>

      {/* 风险预警卡片 (保持不变) */}
      <div className="bg-emerald-950 p-6 rounded-2xl shadow-xl relative overflow-hidden group border border-emerald-800">
        <div className="absolute top-0 right-0 p-6 text-emerald-500/10 opacity-50 group-hover:scale-125 transition-transform duration-700">
          <ShieldCheck size={120} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">{t('project.risk.high_priority_warning')}</span>
            </div>
            <h4 className="text-lg font-black text-white tracking-tight leading-tight">
              {t('project.compliance.team_health') || 'Personnel Continuity Planning'}
            </h4>
            <p className="text-[11px] font-bold text-emerald-300 max-w-md">
              {t('project.risk.visa_overlap') || 'Staff movement monitoring'} • 
              <span className="ml-1 opacity-80">{t('project.compliance.action_hint') || 'Ensuring field operations are maintained.'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* 人员列表网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {personnel.map(p => (
          <div key={p.id} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 -mr-12 -mt-12 rounded-full group-hover:scale-110 transition-transform opacity-50" />
            <div className="flex items-start justify-between relative z-10 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-emerald-400 font-black text-xl shadow-lg group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  {p.employee_name?.charAt(0) || '?'}
                </div>
                <div>
                  <div className="font-black text-base text-slate-900 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{p.employee_name}</div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{p.position}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm",
                  p.on_duty_status === 'on_duty' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                )}>
                  {p.on_duty_status === 'on_duty' ? 'On Site' : 'Off Site'}
                </span>
                
                <div className="flex gap-1">
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
            
            <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-50 relative z-10">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <Calendar size={10} className="text-emerald-500" /> Joined Date
                </p>
                <p className="text-xs font-black text-slate-900 tabular-nums">{p.transfer_in_date?.split('T')[0] || '--'}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <Activity size={10} className="text-emerald-500" /> Status
                </p>
                <p className="text-xs font-black text-emerald-600 tabular-nums">Active</p>
              </div>
            </div>
          </div>
        ))}
      </div>

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
              <div key={e.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-emerald-300 transition-all group">
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
                    onAddPersonnel?.({ employeeId: e.id })
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
    </div>
  )
}

