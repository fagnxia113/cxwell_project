// ============================================================
// 📦 项目详情页 - 概览 Tab
// ============================================================

import React from 'react'
import { useTranslation } from 'react-i18next'
import { 
  FileText, ClipboardList, GitBranch, Wind, Flame, Cpu,
  Briefcase, TrendingUp, List, DollarSign, Zap, User, Wrench, Calendar
} from 'lucide-react'
import type { Project, Phase, Milestone } from '../../types/project'
import { formatDate } from '../../types/project'
import MilestoneTimeline from './MilestoneTimeline'
import ProgressBar from '../ui/ProgressBar'
import EditableField from './EditableField'

interface OverviewTabProps {
  project: Project
  phases: Phase[]
  milestones?: Milestone[]
  isEditing: boolean
  editForm: Partial<Project>
  onEditFormChange: (updates: Partial<Project>) => void
}

export default function OverviewTab({
  project,
  phases,
  milestones = [],
  isEditing,
  editForm,
  onEditFormChange
}: OverviewTabProps) {
  const { t } = useTranslation()

  // 模拟报告的进度统计 (根据项目进度线性模拟报告数，总预估为 200)
  const estimatedTotalReports = 200;
  const simulatedCompletedReports = Math.floor((project.progress / 100) * estimatedTotalReports);

  return (
    <div className="space-y-6">
      {/* 阶段 1: Project Description */}
      <div className="bg-white p-8 rounded-lg border border-slate-100 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 text-emerald-50 opacity-50 group-hover:scale-110 transition-transform">
          <FileText size={120} strokeWidth={0.5} />
        </div>
        <div className="relative z-10 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <span className="w-8 h-px bg-emerald-500/30" /> {t('project.tabs.overview')}
              </h3>
              {isEditing ? (
                <textarea
                  value={editForm.description || ''}
                  onChange={(e) => onEditFormChange({ description: e.target.value })}
                  rows={6}
                  className="w-full rounded-md border-slate-200 text-sm font-bold p-4 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder={t('project.placeholder.description')}
                />
              ) : (
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {project.description || t('project.empty.no_desc')}
                </p>
              )}
            </div>

            <div className="lg:col-span-4 space-y-6 bg-slate-50/50 p-6 rounded-xl border border-slate-100">
              <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4">{t('project.sections.base_info')}</h4>
              <div className="space-y-4">
                <EditableField
                  label={t('project.fields.customer')}
                  icon={Briefcase}
                  value={project.customer_name}
                  isEditing={isEditing}
                  inputType="text"
                  editValue={editForm.customer_name || ''}
                  onChange={v => onEditFormChange({ customer_name: String(v) })}
                />
                <EditableField
                  label={t('project.fields.location')}
                  icon={FileText}
                  value={project.address}
                  isEditing={isEditing}
                  inputType="text"
                  editValue={editForm.address || ''}
                  onChange={v => onEditFormChange({ address: String(v) })}
                />
                <EditableField
                  label={t('project.fields.manager')}
                  icon={User}
                  value={project.manager}
                  isEditing={isEditing}
                  inputType="text"
                  editValue={editForm.manager || ''}
                  onChange={v => onEditFormChange({ manager: String(v) })}
                />
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-1.5">
                    <Calendar size={12} className="text-emerald-500" /> {t('project.fields.period')}
                  </label>
                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={editForm.start_date?.split('T')[0] || ''}
                        onChange={e => onEditFormChange({ start_date: e.target.value })}
                        className="w-full rounded-md border-slate-200 text-[10px] p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                      <input
                        type="date"
                        value={editForm.end_date?.split('T')[0] || ''}
                        onChange={e => onEditFormChange({ end_date: e.target.value })}
                        className="w-full rounded-md border-slate-200 text-[10px] p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-slate-700">
                      {formatDate(project.start_date)} ~ {formatDate(project.end_date)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 阶段 1.2: Numeric Specs (原来在侧边栏) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { key: 'building_area', label: t('project.fields.building_area'), icon: Briefcase, unit: 'm²' },
          { key: 'it_capacity', label: t('project.fields.it_capacity'), icon: TrendingUp, unit: 'kW' },
          { key: 'cabinet_count', label: t('project.fields.cabinet_count'), icon: List, unit: t('common.unit_piece') },
          { key: 'cabinet_power', label: t('project.fields.cabinet_power'), icon: DollarSign, unit: 'kW / R' },
          { key: 'budget', label: t('project.fields.budget'), icon: DollarSign, unit: t('common.unit_ten_thousand') },
        ].map(spec => (
          <div key={spec.key} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <EditableField
              label={spec.label}
              icon={spec.icon}
              value={(project as any)[spec.key] || 0}
              unit={spec.unit}
              isEditing={isEditing}
              inputType="number"
              editValue={(editForm as any)[spec.key] || 0}
              onChange={v => onEditFormChange({ [spec.key]: v })}
              displayMode="metric"
            />
          </div>
        ))}
      </div>

      {/* 阶段 1.5: Technical Architecture Grid (新板块) */}
      <div className="bg-white p-6 lg:p-8 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
           <span className="w-1.5 h-4 bg-emerald-500 rounded-full" /> {t('project.sections.specs')}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EditableField
            label={t('project.fields.power_architecture')}
            icon={GitBranch}
            value={project.power_architecture}
            isEditing={isEditing}
            inputType="textarea"
            editValue={editForm.power_architecture || ''}
            onChange={v => onEditFormChange({ power_architecture: String(v) })}
            displayMode="detailed"
            placeholder={t('project.placeholder.power_architecture')}
          />
          <EditableField
            label={t('project.fields.hvac_architecture')}
            icon={Wind}
            value={project.hvac_architecture}
            isEditing={isEditing}
            inputType="textarea"
            editValue={editForm.hvac_architecture || ''}
            onChange={v => onEditFormChange({ hvac_architecture: String(v) })}
            displayMode="detailed"
            placeholder={t('project.placeholder.hvac_architecture')}
          />
          <EditableField
            label={t('project.fields.fire_architecture')}
            icon={Flame}
            value={project.fire_architecture}
            isEditing={isEditing}
            inputType="textarea"
            editValue={editForm.fire_architecture || ''}
            onChange={v => onEditFormChange({ fire_architecture: String(v) })}
            displayMode="detailed"
            placeholder={t('project.placeholder.fire_architecture')}
          />
          <EditableField
            label={t('project.fields.weak_electric_architecture')}
            icon={Cpu}
            value={project.weak_electric_architecture}
            isEditing={isEditing}
            inputType="textarea"
            editValue={editForm.weak_electric_architecture || ''}
            onChange={v => onEditFormChange({ weak_electric_architecture: String(v) })}
            displayMode="detailed"
            placeholder={t('project.placeholder.weak_electric_architecture')}
          />
        </div>
      </div>

      {/* 阶段 2: Report Progress Block (报告血槽) - 暂时隐藏 */}
      {/* <div className="bg-white p-6 lg:p-8 rounded-xl border border-slate-100 shadow-sm">
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <span className="w-1.5 h-4 bg-indigo-500 rounded-full" /> {t('project.tabs.reports')}
          </div>
          <span className="text-[10px] font-bold text-slate-400 normal-case">{simulatedCompletedReports} / {estimatedTotalReports} {t('project.report.status.submitted')}</span>
        </h3>
        <ProgressBar
          label={t('dashboard.compliance_daily_report_rate')}
          progress={project.progress > 0 ? Math.round((simulatedCompletedReports / estimatedTotalReports) * 100) : 0}
          icon={ClipboardList}
          colorClass="indigo"
        />
      </div> */}

      {/* 阶段 3: Milestone Timeline (鱼骨图) */}
      <MilestoneTimeline milestones={milestones} projectStatus={project.status} />
    </div>
  )
}

function StatItem({ label, value, bgColor, textColor, borderColor }: any) {
  return (
    <div className={`${bgColor} p-6 rounded-lg border ${borderColor} text-center`}>
      <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{label}</p>
    </div>
  )
}
