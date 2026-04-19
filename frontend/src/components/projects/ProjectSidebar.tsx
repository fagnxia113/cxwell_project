// ============================================================
// 📦 项目详情页 - 侧边栏（负责人信息 + 技术规格仪表盘）
// 精简点：原来 9 个技术规格字段各自写了一遍
//         isEditing ? <input> : <display>（约 200 行重复代码），
//         现在用 EditableField 组件 + 数据驱动，不到 100 行搞定。
// ============================================================

import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  User, Wrench, Calendar, Briefcase, TrendingUp, List,
  DollarSign, Zap, GitBranch, Wind, Flame, Cpu,
} from 'lucide-react'
import EditableField from './EditableField'
import type { Project, Phase } from '../../types/project'
import { formatDate } from '../../types/project'
import { cn } from '../../utils/cn'

interface ProjectSidebarProps {
  project: Project
  phases: Phase[]
  isEditing: boolean
  editForm: Partial<Project>
  onEditFormChange: (updates: Partial<Project>) => void
}

// 精简点：用配置数组驱动 9 个技术规格字段，消除大量重复代码
const NUMERIC_SPECS = [
  { key: 'building_area',  labelKey: 'project.fields.building_area',  icon: Briefcase,  unit: 'm²' },
  { key: 'it_capacity',    labelKey: 'project.fields.it_capacity',    icon: TrendingUp,  unit: 'kW' },
  { key: 'cabinet_count',  labelKey: 'project.fields.cabinet_count',  icon: List,        unitKey: 'common.unit_piece' },
  { key: 'cabinet_power',  labelKey: 'project.fields.cabinet_power',  icon: DollarSign,  unit: 'kW / R' },
  { key: 'rack_power',     labelKey: 'project.fields.rack_power',     icon: Zap,         unit: 'kW' },
] as const


export default function ProjectSidebar({
  project,
  phases,
  isEditing,
  editForm,
  onEditFormChange,
}: ProjectSidebarProps) {
  const { t } = useTranslation()

  return (
    <div className="lg:col-span-3 space-y-4">
      {/* 负责人信息卡片 */}
      <div className="bg-white p-5 rounded-lg border border-slate-100 shadow-sm space-y-5">
        {/* 项目经理 */}
        <EditableField
          label={t('project.fields.manager')}
          icon={User}
          value={project.manager}
          isEditing={isEditing}
          inputType="text"
          editValue={editForm.manager || ''}
          onChange={v => onEditFormChange({ manager: String(v) })}
          placeholder={t('common.not_specified')}
        />

        {/* 技术负责人 */}
        <EditableField
          label={t('project.fields.tech_manager')}
          icon={Wrench}
          value={project.tech_manager}
          isEditing={isEditing}
          inputType="text"
          editValue={editForm.tech_manager || ''}
          onChange={v => onEditFormChange({ tech_manager: String(v) })}
          placeholder={t('common.not_specified')}
        />

        {/* 时间周期 */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-1.5">
            <Calendar size={12} className="text-emerald-500" /> {t('project.fields.period')}
          </label>
          {isEditing ? (
            <div className="space-y-2">
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
            <p className="text-[11px] font-bold text-slate-600">
              {formatDate(project.start_date)} ~ {formatDate(project.end_date)}
            </p>
          )}
        </div>

        {/* ---- 技术规格仪表盘 ---- */}
        {/* 精简点：用数据驱动替代 9 次复制粘贴 */}
        <div className="pt-6 border-t border-slate-100">
          <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-5 flex items-center justify-between">
            {t('project.sections.specs')}
            <div className="flex gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-400" />
              <span className="w-1 h-1 rounded-full bg-emerald-400" />
              <span className="w-1 h-1 rounded-full bg-emerald-400" />
            </div>
          </h4>
          <div className="space-y-5">
            {/* 数值型规格 */}
            {NUMERIC_SPECS.map(spec => (
              <EditableField
                key={spec.key}
                label={t(spec.labelKey)}
                icon={spec.icon}
                value={(project as any)[spec.key] || 0}
                unit={'unitKey' in spec ? t(spec.unitKey) : spec.unit}
                isEditing={isEditing}
                inputType="number"
                editValue={(editForm as any)[spec.key] || 0}
                onChange={v => onEditFormChange({ [spec.key]: v })}
                displayMode="metric"
              />
            ))}

            </div>
        </div>
      </div>

      {/* 节点状态概览卡片 */}
      <div className="bg-emerald-600 p-5 rounded-lg shadow-md relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl group-hover:scale-125 transition-transform" />
        <h4 className="text-[10px] font-bold text-emerald-200 uppercase tracking-[0.2em] mb-3">
          {t('project.workflow.node_status')}
        </h4>
        <div className="space-y-3 relative z-10">
          <div className="flex justify-between items-center text-white">
            <span className="text-xs font-bold">{t('project.milestone.total_phases')}</span>
            <span className="text-base font-bold">{phases.length}</span>
          </div>
          <div className="flex justify-between items-center text-emerald-300">
            <span className="text-xs font-bold">{t('project.status.completed')}</span>
            <span className="text-base font-bold">
              {phases.filter(p => p.status === 'completed').length}
            </span>
          </div>
          <div className="flex justify-between items-center text-white/70">
            <span className="text-xs font-bold">{t('project.status.in_progress')}</span>
            <span className="text-base font-bold">
              {phases.filter(p => p.status === 'in_progress').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
