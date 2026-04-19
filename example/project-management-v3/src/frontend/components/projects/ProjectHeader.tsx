// ============================================================
// 📦 项目详情页 - 页面头部
// 精简点：原来头部代码在主 return 和 renderMilestoneManager
//         中各写了一份（约 60 行 x 2），现在只有这一份。
// ============================================================

import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChevronLeft, Edit3, Trash2, Save, RotateCcw, CheckCircle,
  Hash, MapPin, FileDown, User, ShieldCheck, DollarSign
} from 'lucide-react'
import StatusBadge from './StatusBadge'
import type { Project } from '../../types/project'

interface ProjectHeaderProps {
  project: Project
  isAdmin: boolean
  isEditing: boolean
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
  onSave: () => void
  onCancel: () => void
  onExportPDF?: () => void
}

export default function ProjectHeader({
  project,
  isAdmin,
  isEditing,
  onBack,
  onEdit,
  onDelete,
  onSave,
  onCancel,
  onExportPDF,
}: ProjectHeaderProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
      <div className="flex items-start gap-4">
        <button
          onClick={onBack}
          className="w-10 h-10 shrink-0 bg-white hover:bg-slate-50 rounded-lg shadow-sm border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 transition-all"
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
          <div className="flex items-center gap-3 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Hash size={14} className="text-emerald-500" />
              {project.code}
            </span>
            <div className="w-1 h-1 bg-slate-200 rounded-full" />
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="text-emerald-500" />
              {project.country || t('project.fields.country_pending')}
            </span>
            <div className="w-1 h-1 bg-slate-200 rounded-full" />
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded text-slate-600">
              <User size={12} className="text-emerald-500" />
              {project.manager || t('common.noData')}
            </span>
          </div>
        </div>
      </div>

      {/* 操作按钮 - 仅管理员可见 */}
      <div className="flex flex-wrap items-center gap-2">
        {isAdmin && (
          <>
            {!isEditing ? (
              <>
                <button
                  onClick={onExportPDF}
                  className="px-4 py-2 bg-slate-900 text-white rounded-md shadow-md hover:bg-slate-800 transition-all font-bold text-xs flex items-center gap-2"
                >
                  <FileDown size={16} /> {t('common.export') || 'Export'} PDF
                </button>
                <button
                  onClick={onEdit}
                  className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-md shadow-sm hover:bg-slate-50 transition-all font-bold text-xs flex items-center gap-2"
                >
                  <Edit3 size={16} /> {t('common.edit')}
                </button>
                <button
                  onClick={onDelete}
                  className="px-4 py-2 bg-white text-rose-600 border border-rose-100 rounded-md shadow-sm hover:bg-rose-50 transition-all font-bold text-xs flex items-center gap-2"
                >
                  <Trash2 size={16} /> {t('common.delete')}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onSave}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-md shadow-md hover:bg-emerald-700 transition-all font-bold text-xs flex items-center gap-2"
                >
                  <CheckCircle size={16} /> {t('common.save')}
                </button>
                <button
                  onClick={onCancel}
                  className="px-4 py-2 bg-white text-slate-400 border border-slate-200 rounded-md shadow-sm hover:bg-slate-50 transition-all font-bold text-xs flex items-center gap-2"
                >
                  <RotateCcw size={16} /> {t('common.cancel')}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
