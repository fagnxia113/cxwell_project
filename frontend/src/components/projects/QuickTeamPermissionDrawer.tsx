import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Shield, ShieldAlert, CheckCircle2, Loader2, UserPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { apiClient } from '../../utils/apiClient'
import { useMessage } from '../../hooks/useMessage'
import { cn } from '../../utils/cn'

interface ProjectPersonnel {
  employee_id: string;
  name: string;
  role: string;
  can_edit: boolean;
}

interface QuickTeamPermissionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

export default function QuickTeamPermissionDrawer({ 
  isOpen, 
  onClose, 
  projectId, 
  projectName 
}: QuickTeamPermissionDrawerProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState<ProjectPersonnel[]>([])
  const { success, error: showError } = useMessage()

  useEffect(() => {
    if (isOpen && projectId) {
      loadMembers()
    }
  }, [isOpen, projectId])

  const loadMembers = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get<any>(`/api/data/project_personnel?filter=${encodeURIComponent(JSON.stringify({ project_id: projectId }))}`)
      const data = res?.data || res?.items || res || []
      setMembers(data)
    } catch (err: any) {
      showError(t('personnel.error.load_failed') || 'Failed to load members')
    } finally {
      setLoading(false)
    }
  }

  const togglePermission = async (employeeId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus
      const result = await apiClient.put<any>(`/api/project/extension/${projectId}/personnel/${employeeId}/permission`, { canEdit: newStatus })
      if (result?.success) {
        setMembers(prev => prev.map(m => 
          m.employee_id === employeeId ? { ...m, can_edit: newStatus } : m
        ))
        success(t('common.success'))
      }
    } catch (err: any) {
      showError(err.message || t('common.error'))
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-full max-w-md h-full bg-white shadow-2xl z-[70] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">{t('project.tabs.team')}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[200px]">{projectName}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('common.list')} ({members.length})</span>
                <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">{t('project.milestone.resources_action') || 'Management'}</span>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('common.loading')}</p>
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('common.noData')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div 
                      key={member.employee_id}
                      className="group p-4 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/10 transition-all flex items-center justify-between shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 font-black group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          {member.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{member.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{member.role}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => togglePermission(member.employee_id, member.can_edit)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ring-1",
                            member.can_edit 
                              ? "bg-emerald-50 text-emerald-600 ring-emerald-100 hover:bg-emerald-100" 
                              : "bg-slate-50 text-slate-400 ring-slate-100 hover:bg-slate-100"
                          )}
                        >
                          {member.can_edit ? <CheckCircle2 size={12} /> : <ShieldAlert size={12} />}
                          {member.can_edit ? t('common.status_active') || 'Enabled' : t('common.status_inactive') || 'Disabled'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/30">
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                <p className="text-[10px] font-black text-indigo-700 uppercase tracking-[0.1em] leading-relaxed">
                  {t('project.milestone.permission_desc') || 'Enabled members can directly edit project milestones and update progress without workflow approval.'}
                </p>
              </div>
              <button 
                onClick={onClose}
                className="w-full mt-4 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-slate-900/20 active:scale-95 transition-all"
              >
                {t('common.confirm')}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
