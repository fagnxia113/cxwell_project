import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, Plus, Trash2, Repeat, Coffee, Info } from 'lucide-react'
import { cn } from '../../utils/cn'
import type { ProjectStaffingPlan, ProjectPersonnel } from '../../types/project'

interface StaffingTabProps {
  personnel: ProjectPersonnel[]
  staffingPlans: ProjectStaffingPlan[]
  onAddPlan: (data: any) => void
  onDeletePlan: (id: string) => void
  isAdmin: boolean
}

export default function StaffingTab({ personnel, staffingPlans, onAddPlan, onDeletePlan, isAdmin }: StaffingTabProps) {
  const { t } = useTranslation()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPlan, setNewPlan] = useState({ 
    employee_id: personnel[0]?.employee_id || '', 
    plan_type: 'rotation', 
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[1],
    notes: '' 
  })

  const handleAdd = () => {
    if (!newPlan.employee_id) return
    onAddPlan(newPlan)
    setShowAddForm(false)
  }

  // 动态计算导签/请假重叠风险 (若在同一时间段内有大于等于2人重合则高亮报警)
  const getLeaveOverlapCount = () => {
    const leavePlans = staffingPlans.filter(p => p.plan_type === 'leave')
    let maxOverlap = 0
    leavePlans.forEach(planA => {
      const startA = new Date(planA.start_date).getTime()
      const endA = new Date(planA.end_date).getTime()
      let currentOverlap = 1
      leavePlans.forEach(planB => {
        if (planA.id !== planB.id) {
          const startB = new Date(planB.start_date).getTime()
          const endB = new Date(planB.end_date).getTime()
          if (startA <= endB && endA >= startB) {
            currentOverlap++
          }
        }
      })
      if (currentOverlap > maxOverlap) maxOverlap = currentOverlap
    })
    return maxOverlap
  }

  const overlapCount = getLeaveOverlapCount();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
          <Calendar size={18} className="text-indigo-500" /> {t('project.tabs.staffing')}
        </h3>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.location.href = '/personnel/attendance-overview'}
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl text-xs font-black shadow-sm hover:bg-slate-50 transition-all"
          >
            <Repeat size={16} /> {t('rotation.view_overview') || 'View Overview'}
          </button>
          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg hover:bg-indigo-700 transition-all"
          >
            <Plus size={16} /> {t('project.staffing.add_plan')}
          </button>
        </div>
      </div>

      {/* 风险提示 (仅在有重发风险时显示) */}
      {overlapCount >= 2 && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-start gap-4 shadow-sm animate-pulse-fade">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <Info size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="text-[11px] font-black text-rose-800 uppercase tracking-widest">
              {t('project.staffing.overlap_alert') || 'High Risk Alert: Staff Overlap'}
            </h4>
            <p className="text-[11px] font-bold text-rose-600 opacity-80">
              {t('project.risk.visa_overlap') || `Warning: ${overlapCount} team members are scheduled for leave or visa processing simultaneously. Please review staffing carefully.`}
            </p>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('daily_report.select_personnel')}</label>
              <select 
                value={newPlan.employee_id}
                onChange={e => setNewPlan({...newPlan, employee_id: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all"
              >
                {personnel.map(p => (
                  <option key={p.id} value={p.employee_id}>{p.employee_name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('project.staffing.plan_type')}</label>
              <select 
                value={newPlan.plan_type}
                onChange={e => setNewPlan({...newPlan, plan_type: e.target.value as any})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all"
              >
                <option value="rotation">{t('project.staffing.rotation')}</option>
                <option value="leave">{t('project.staffing.leave')}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('project.staffing.start_date')}</label>
              <input 
                type="date" 
                value={newPlan.start_date}
                onChange={e => setNewPlan({...newPlan, start_date: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('project.staffing.end_date')}</label>
              <input 
                type="date" 
                value={newPlan.end_date}
                onChange={e => setNewPlan({...newPlan, end_date: e.target.value})}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('project.staffing.notes')}</label>
            <input 
              type="text" 
              value={newPlan.notes}
              onChange={e => setNewPlan({...newPlan, notes: e.target.value})}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all"
              placeholder={t('project.staffing.placeholder_notes')}
            />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button onClick={() => setShowAddForm(false)} className="px-5 py-2 text-[11px] font-black text-slate-400 hover:text-slate-600">{t('common.cancel')}</button>
            <button onClick={handleAdd} className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-[11px] font-black shadow-lg hover:bg-indigo-700 transition-all">{t('common.submit')}</button>
          </div>
        </div>
      )}

      {/* 计划列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {staffingPlans.length === 0 ? (
          <div className="md:col-span-2 py-16 text-center bg-white rounded-xl border border-slate-100 border-dashed">
            <p className="text-slate-300 font-bold uppercase tracking-widest text-[9px]">{t('project.staffing.no_plans')}</p>
          </div>
        ) : (
          staffingPlans.map(plan => (
            <div key={plan.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shadow-inner",
                    plan.plan_type === 'rotation' ? "bg-indigo-50 text-indigo-600" : "bg-amber-50 text-amber-600"
                  )}>
                    {plan.plan_type === 'rotation' ? <Repeat size={16} /> : <Coffee size={16} />}
                  </div>
                  <div>
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-tight">{plan.employee_name || 'Project Staff'}</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      {plan.plan_type === 'rotation' ? t('project.staffing.rotation') : t('project.staffing.leave')}
                    </p>
                  </div>
                </div>
                {isAdmin && (
                  <button 
                    onClick={() => onDeletePlan(plan.id)}
                    className="p-1.5 text-slate-200 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              
              <div className="bg-slate-50 p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Duration</span>
                  <span className="text-[10px] font-black text-slate-900 tabular-nums">
                    {new Date(plan.start_date).toLocaleDateString()} ~ {new Date(plan.end_date).toLocaleDateString()}
                  </span>
                </div>
                {plan.notes && (
                  <div className="pt-2 border-t border-slate-200/50">
                    <p className="text-[10px] font-bold text-slate-500 italic">"{plan.notes}"</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
