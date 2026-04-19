// ============================================================
// 📦 里程碑卡片组件
// 精简点：将单体大页面中复杂的里程碑卡片布局（约 140 行）抽离
//         包含状态展示、圆形进度条、资源收集条和操作按钮
// ============================================================

import React from 'react'
import { useTranslation } from 'react-i18next'
import { Calendar, Wrench, FilePlus, TrendingUp, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'
import type { Milestone, Project } from '../../types/project'
import { formatDate } from '../../types/project'

interface MilestoneCardProps {
  milestone: Milestone
  project: Project | null
  onEditResources: (m: Milestone) => void
  onUpdateProgress: (m: Milestone) => void
  onFinish: (m: Milestone) => void
}

export default function MilestoneCard({
  milestone,
  project,
  onEditResources,
  onUpdateProgress,
  onFinish
}: MilestoneCardProps) {
  const { t } = useTranslation()
  const m = milestone
  const isDelayed = new Date() > new Date(m.planned_end_date) && m.progress < 100

  return (
    <div className="group/mcard bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 overflow-hidden flex flex-col relative">
      {/* 侧边状态指示条 */}
      <div className={cn(
        "absolute top-0 left-0 bottom-0 w-1.5 transition-all duration-500 group-hover/mcard:w-2",
        m.status === 'completed' ? "bg-emerald-500" :
        isDelayed ? "bg-rose-500" :
        "bg-blue-500"
      )} />

      <div className="p-6 pl-8 border-b border-slate-50 flex justify-between items-start bg-gradient-to-br from-white to-slate-50/30">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h4 className="font-black text-base text-slate-900 tracking-tight group-hover/mcard:text-blue-600 transition-colors uppercase">
              {m.name}
            </h4>
            <span className={cn(
              "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm",
              m.status === 'completed' ? "bg-emerald-100 text-emerald-700" :
              m.status === 'in_progress' ? "bg-blue-100 text-blue-700" :
              isDelayed ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500"
            )}>
              {t(`project.status.${m.status}`) || m.status}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <Calendar size={12} className="text-slate-300" />
            <span className="tabular-nums">{formatDate(m.planned_start_date)}</span>
            <span className="text-slate-200">/</span>
            <span className={cn("tabular-nums", isDelayed ? "text-rose-400 font-black" : "")}>
              {formatDate(m.planned_end_date)}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-100" />
              <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4"
                className={cn(
                  "transition-all duration-1000",
                  m.status === 'completed' ? "text-emerald-500" :
                  isDelayed ? "text-rose-500" : "text-blue-500"
                )}
                strokeDasharray={2 * Math.PI * 24}
                strokeDashoffset={2 * Math.PI * 24 * (1 - m.progress / 100)}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[11px] font-black text-slate-900">{m.progress}%</span>
          </div>
        </div>
      </div>
      
      <div className="p-6 pl-8 space-y-5 flex-1">
        {m.description && (
          <p className="text-xs font-medium text-slate-500 leading-relaxed italic border-l-2 border-slate-100 pl-3">
            {m.description}
          </p>
        )}
        
        {/* 资源进展条 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Wrench size={10} /> {t('project.milestone.resources')}
            </span>
            <span className="text-[10px] font-black text-slate-900 tabular-nums">
              {m.resources.filter(r => r.status === 'complete').length} <span className="text-slate-300">/</span> {m.resources.length}
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner border border-slate-200/50">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${m.resources.length > 0 ? (m.resources.filter(r => r.status === 'complete').length / m.resources.length * 100) : 0}%` }}
              className={cn(
                "h-full relative",
                m.resources.filter(r => r.status === 'complete').length === m.resources.length ? "bg-emerald-500" : "bg-emerald-600"
              )}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </motion.div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 bg-slate-50 text-slate-500 text-[9px] font-black rounded uppercase tracking-wider border border-slate-100">
            {t('project.milestone.weight')}: {m.weight}%
          </span>
        </div>
      </div>

      <div className="p-4 pl-8 bg-slate-50/80 border-t border-slate-100 flex justify-end gap-2 group-hover/mcard:bg-white transition-colors">
        <button
          onClick={() => onEditResources(m)}
          className="px-4 py-2 hover:bg-white hover:text-emerald-600 text-slate-500 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all border border-transparent hover:border-emerald-100 hover:shadow-sm"
        >
          <FilePlus size={14} /> {t('project.milestone.resources_action')}
        </button>
        <button
          onClick={() => onUpdateProgress(m)}
          className="px-4 py-2 hover:bg-white hover:text-emerald-600 text-emerald-500 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all border border-transparent hover:border-emerald-100 hover:shadow-sm"
        >
          <TrendingUp size={14} /> {t('project.milestone.update_progress')}
        </button>
        {m.status !== 'completed' && (
          <button
            onClick={() => onFinish(m)}
            className="px-4 py-2 bg-slate-900 text-white hover:bg-emerald-600 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all shadow-md shadow-slate-900/10 hover:shadow-emerald-500/20"
          >
            <Check size={14} /> {t('project.milestone.finish')}
          </button>
        )}
      </div>
    </div>
  )
}
