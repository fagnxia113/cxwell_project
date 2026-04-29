import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertTriangle, Plus, Trash2, User, Clock, Calendar,
  LayoutGrid, ShieldCheck, History, MoreVertical, Edit2,
  AlertCircle, Activity, CheckCircle
} from 'lucide-react'
import { cn } from '../../utils/cn'
import type { ProjectRisk, Milestone } from '../../types/project'
import { motion, AnimatePresence } from 'framer-motion'
import { flattenMilestones } from '../../utils/milestoneUtils'

interface RisksTabProps {
  risks: ProjectRisk[]
  milestones: Milestone[]
  onAddRisk: (data: any) => void
  onUpdateRisk: (id: string, data: any) => void
  onDeleteRisk: (id: string) => void
  isAdmin: boolean
  isProjectManager?: boolean
  isProjectMember?: boolean
}

const severityConfig = {
  low: { label: 'project.risk.levels.low', color: 'text-blue-500', bgColor: 'bg-blue-50', dot: 'bg-blue-500' },
  medium: { label: 'project.risk.levels.medium', color: 'text-amber-500', bgColor: 'bg-amber-50', dot: 'bg-amber-500' },
  high: { label: 'project.risk.levels.high', color: 'text-orange-500', bgColor: 'bg-orange-50', dot: 'bg-orange-500' },
  critical: { label: 'project.risk.levels.critical', color: 'text-rose-500', bgColor: 'bg-rose-50', dot: 'bg-rose-500' },
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  identified: { label: 'project.risk.status_labels.identified', color: 'text-amber-500', bgColor: 'bg-amber-50', icon: AlertCircle },
  mitigated: { label: 'project.risk.status_labels.mitigated', color: 'text-blue-500', bgColor: 'bg-blue-50', icon: Activity },
  closed: { label: 'project.risk.status_labels.closed', color: 'text-emerald-500', bgColor: 'bg-emerald-50', icon: CheckCircle },
  pending: { label: 'project.risk.status_labels.pending', color: 'text-slate-500', bgColor: 'bg-slate-100', icon: AlertCircle },
  in_progress: { label: 'project.risk.status_labels.in_progress', color: 'text-blue-500', bgColor: 'bg-blue-50', icon: Activity },
  pending_review: { label: 'project.risk.status_labels.pending_review', color: 'text-amber-500', bgColor: 'bg-amber-50', icon: AlertCircle }
};

const categoryOptions = [
  { value: 'progress', label: 'project.risk.categories.progress' },
  { value: 'quality', label: 'project.risk.categories.quality' },
  { value: 'safety', label: 'project.risk.categories.safety' },
  { value: 'supply_chain', label: 'project.risk.categories.supply_chain' },
]

export default function RisksTab({ risks, milestones, onAddRisk, onUpdateRisk, onDeleteRisk, isAdmin, isProjectManager, isProjectMember }: RisksTabProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'active' | 'closed'>('active')
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    level: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    category: 'quality',
    milestoneId: '',
    deadline: '',
    status: 'identified'
  })

  const flattenedMilestones = useMemo(() => flattenMilestones(milestones), [milestones]);

  const stats = useMemo(() => {
    const now = new Date();
    const activeRisks = risks.filter(r => r.status !== 'closed');
    const closedRisks = risks.filter(r => r.status === 'closed');
    const overdueRisks = activeRisks.filter(r => r.deadline && new Date(r.deadline) < now);
    
    const startOfWeek = new Date();
    startOfWeek.setDate(now.getDate() - now.getDay());
    const thisWeekClosed = closedRisks.filter(r => r.closed_at && new Date(r.closed_at) >= startOfWeek);

    return {
      activeTotal: activeRisks.length,
      highSeverity: activeRisks.filter(r => (r.level as string) === 'high' || (r.level as string) === 'critical').length,
      overdueTotal: overdueRisks.length,
      thisWeekClosed: thisWeekClosed.length
    }
  }, [risks]);

  const filteredRisks = useMemo(() => {
    return risks.filter(r => (activeTab === 'active' ? r.status !== 'closed' : r.status === 'closed'));
  }, [risks, activeTab]);

  const handleAdd = () => {
    if (!formData.title) return
    onAddRisk(formData)
    setFormData({
      title: '',
      description: '',
      level: 'medium',
      category: 'quality',
      milestoneId: '',
      deadline: '',
      status: 'identified'
    })
    setShowAddForm(false)
  }

  const isOverdue = (risk: ProjectRisk) => {
    if (risk.status === 'closed' || !risk.deadline) return false;
    return new Date(risk.deadline) < new Date();
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: t('project.risk.stats.active_total'), value: stats.activeTotal, color: 'slate', icon: LayoutGrid },
          { label: t('project.risk.stats.high_severity'), value: stats.highSeverity, color: 'rose', icon: AlertTriangle },
          { label: t('project.risk.stats.overdue_total'), value: stats.overdueTotal, color: 'amber', icon: Clock },
          { label: t('project.risk.stats.this_week_closed'), value: stats.thisWeekClosed, color: 'emerald', icon: ShieldCheck },
        ].map(s => (
          <div key={s.label} className={cn(
            "rounded-xl border p-4 shadow-sm transition-all",
            s.color === 'slate' ? "bg-white border-slate-100" : 
            s.color === 'rose' ? "bg-rose-50 border-rose-100" :
            s.color === 'amber' ? "bg-amber-50 border-amber-100" : "bg-emerald-50 border-emerald-100"
          )}>
            <div className={cn("text-[9px] font-black uppercase tracking-widest mb-1", `text-${s.color}-500`)}>{s.label}</div>
            <div className="flex items-end justify-between">
              <div className={cn("text-xl font-black", `text-${s.color}-900`)}>{s.value}</div>
              <s.icon size={16} className={cn(`text-${s.color}-200`)} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
          {(['active', 'closed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-5 py-2 rounded-lg text-xs font-black transition-all",
                activeTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {tab === 'active' ? t('project.risk.tabs.active') : t('project.risk.tabs.closed')}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-black shadow-lg hover:bg-slate-800 transition-all w-fit"
          style={{ display: (isAdmin || isProjectManager || isProjectMember) ? 'flex' : 'none' }}
        >
          <Plus size={16} /> {t('project.risk.add')}
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl mb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('project.risk.placeholder_title')}</label>
                  <input 
                    type="text" 
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                    placeholder={t('project.risk.example')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('project.risk.category')}</label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                  >
                    {categoryOptions.map(opt => <option key={opt.value} value={opt.value}>{t(opt.label)}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('project.risk.severity')}</label>
                  <select 
                    value={formData.level}
                    onChange={e => setFormData({...formData, level: e.target.value as any})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                  >
                    <option value="low">🟢 {t('project.risk.levels.low')}</option>
                    <option value="medium">🟡 {t('project.risk.levels.medium')}</option>
                    <option value="high">🔴 {t('project.risk.levels.high')}</option>
                    <option value="critical">🔥 {t('project.risk.levels.critical')}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('project.milestone.relate') || '关联阶段'}</label>
                  <select 
                    value={formData.milestoneId}
                    onChange={e => setFormData({...formData, milestoneId: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                  >
                    <option value="">{t('common.notRelated') || 'Not Related'}</option>
                    {flattenedMilestones.map(m => (
                      <option key={m.id} value={m.id}>{m.displayName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('project.risk.deadline')}</label>
                  <input 
                    type="date" 
                    value={formData.deadline}
                    onChange={e => setFormData({...formData, deadline: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowAddForm(false)} className="px-6 py-2.5 text-xs font-black text-slate-400 hover:text-slate-600">{t('common.cancel')}</button>
                <button onClick={handleAdd} className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black shadow-lg hover:bg-slate-800 transition-all">{t('common.confirmCreate') || 'Confirm Create'}</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-24">{t('project.risk.risk_no')}</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('project.risk.description')}</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-28">{t('project.milestone.relate') || '关联阶段'}</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-28">{t('project.risk.category')}</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">{t('project.risk.severity')}</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">
                  {activeTab === 'active' ? t('project.risk.deadline') : t('project.risk.actual_closed_at')}
                </th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32">{t('project.risk.update_time')}</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-28">{t('project.risk.status_label')}</th>
                <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-24 text-right">{t('common.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRisks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <ShieldCheck size={40} className="text-slate-100" />
                      <p className="text-slate-300 font-bold uppercase tracking-widest text-[9px]">{t('project.risk.empty')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRisks.map(risk => {
                  const overdue = isOverdue(risk);
                  const sevInfo = severityConfig[risk.level] || severityConfig.medium;
                  const statusInfo = statusConfig[risk.status as keyof typeof statusConfig] || statusConfig.identified;
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <tr 
                      key={risk.id} 
                      className={cn(
                        "group transition-all hover:bg-slate-50/50",
                        overdue && "bg-rose-50/30"
                      )}
                    >
                      <td className="px-4 py-4">
                        <span className="text-[10px] font-black text-slate-400 font-mono tracking-tighter bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          {risk.risk_no || `RSK-OLD-${risk.id.slice(-3)}`}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className={cn("text-xs font-black tracking-tight", overdue ? "text-rose-700" : "text-slate-900")}>
                            {overdue && "⚠️ "}{risk.title}
                          </div>
                          {risk.description && (
                            <div className="text-[10px] text-slate-400 font-medium line-clamp-1 group-hover:line-clamp-none transition-all">
                              {risk.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[10px] font-bold text-slate-600">
                          {flattenedMilestones.find(m => m.id === risk.milestone_id)?.name || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {t(categoryOptions.find(o => o.value === risk.category)?.label || 'project.risk.categories.progress')}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className={cn("flex items-center gap-2 text-[10px] font-black", sevInfo.color)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", sevInfo.dot)} />
                          {t(sevInfo.label)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className={cn(
                          "flex items-center gap-1.5 text-[10px] font-bold",
                          overdue ? "text-rose-600" : "text-slate-500"
                        )}>
                          {activeTab === 'active' ? (
                            <>
                              <Calendar size={12} className={overdue ? "text-rose-400" : "text-slate-300"} />
                              {risk.deadline ? new Date(risk.deadline).toLocaleDateString() : '-'}
                            </>
                          ) : (
                            <>
                              <History size={12} className="text-emerald-400" />
                              {risk.closed_at ? new Date(risk.closed_at).toLocaleDateString() : '-'}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                          <Clock size={12} className="text-slate-200" />
                          {risk.update_time ? new Date(risk.update_time).toLocaleDateString() : '-'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={risk.status}
                          onChange={(e) => onUpdateRisk(risk.id, { status: e.target.value })}
                          className={cn(
                            "text-[10px] font-black px-2 py-1 rounded-lg border-none focus:ring-2 focus:ring-slate-900 transition-all cursor-pointer outline-none",
                            statusInfo.bgColor, statusInfo.color
                          )}
                        >
                          <option value="pending">{t('project.risk.status.pending')}</option>
                          <option value="in_progress">{t('project.risk.status.in_progress')}</option>
                          <option value="pending_review">{t('project.risk.status.pending_review')}</option>
                          <option value="closed">{t('project.risk.status.closed')}</option>
                        </select>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {(isAdmin || isProjectManager) && (
                            <button
                              onClick={() => onDeleteRisk(risk.id)}
                              className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
