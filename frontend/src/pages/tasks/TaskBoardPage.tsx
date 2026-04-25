import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Layout,
  Calendar,
  AlertCircle,
  FileText,
  Tag,
  DollarSign,
  ArrowUpRight,
  Plus
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../utils/cn'
import { useFetch } from '../../hooks/useReactQuery'
import { apiClient } from '../../utils/apiClient'
import { useMessage } from '../../hooks/useMessage'

type TabType = 'milestone' | 'risk' | 'report' | 'tag' | 'expense';

export default function TaskBoardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { success, error: showError } = useMessage()
  const [activeTab, setActiveTab] = useState<TabType>('milestone')

  const { data: boardRes, isLoading, refetch } = useFetch(
    ['task-board'],
    '/api/project/task-board'
  )

  const projects = boardRes?.data?.projects || []

  // 瀑布流逻辑：将项目分配到不同的列
  // 务实方案：手动分列以确保在没有复杂库的情况下实现瀑布流效果
  const columns = useMemo(() => {
    const cols: any[][] = [[], [], []]
    projects.forEach((p: any, i: number) => {
      cols[i % 3].push(p)
    })
    return cols
  }, [projects])

  const handleUpdateStatus = async (type: string, id: string, updateData: any) => {
    try {
      if (type === 'milestone') await apiClient.put(`/api/milestones/${id}/progress`, updateData);
      if (type === 'risk') await apiClient.put(`/api/project/extension/risks/${id}`, updateData);
      success(t('common.success'))
      refetch()
    } catch (err: any) {
      showError(err.message || t('common.error'))
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mesh">
        <div className="w-8 h-8 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    )
  }

  const tabs = [
    { id: 'milestone', label: t('project.tabs.milestones'), icon: Calendar },
    { id: 'risk', label: t('project.tabs.risks'), icon: AlertCircle },
    { id: 'report', label: t('project.tabs.reports'), icon: FileText },
    { id: 'tag', label: t('project.tabs.tags'), icon: Tag },
    { id: 'expense', label: t('project.tabs.expenses'), icon: DollarSign },
  ]

  return (
    <div className="min-h-screen bg-mesh p-4 lg:p-6 space-y-6 animate-fade-in custom-scrollbar">
      {/* 全局头部 */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-lg text-white shadow-sm">
              <Layout size={20} strokeWidth={2.5} />
            </div>
            {t('project.task_board.title')}
          </h1>
          <p className="text-slate-500 text-sm pl-11">{t('project.task_board.desc')}</p>
        </div>

        {/* 全局页签控制 */}
        <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2",
                activeTab === tab.id 
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              )}
            >
              <tab.icon size={14} strokeWidth={2.5} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 瀑布流布局区域 */}
      {projects.length === 0 ? (
        <div className="py-20 text-center bg-white/50 border-2 border-dashed border-slate-200 rounded-3xl">
          <p className="text-slate-400 font-medium">{t('common.no_data')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
          {/* 渲染三列瀑布流容器 */}
          {[0, 1, 2].map((colIdx) => (
            <div key={colIdx} className={cn("flex flex-col gap-6", colIdx >= 1 && "hidden md:flex", colIdx >= 2 && "hidden xl:flex")}>
              {columns[colIdx].map((project: any, pIdx: number) => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  activeTab={activeTab} 
                  t={t} 
                  navigate={navigate}
                  handleUpdateStatus={handleUpdateStatus}
                  idx={pIdx}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// 抽离项目卡片组件，以支持瀑布流堆叠
function ProjectCard({ project, activeTab, t, navigate, handleUpdateStatus, idx }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.1 }}
      className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all group overflow-hidden"
    >
      {/* 项目头部 */}
      <div className="p-5 border-b border-slate-100 bg-slate-50/30">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-lg shadow-md">
              {(project.projectName || project.name || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 line-clamp-1">{project.projectName || project.name}</h2>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                {t(`project.role.${project.userRole}`) || project.userRole}
              </span>
            </div>
          </div>
          <button 
            onClick={() => navigate(`/projects/${project.id}`)}
            className="p-2 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
          >
            <ArrowUpRight size={18} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{project.projectCode || project.code} • {project.country}</p>
          <div className="text-right">
            <span className="text-lg font-black text-slate-800">{project.progress}%</span>
          </div>
        </div>
        <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500" style={{ width: `${project.progress}%` }} />
        </div>
      </div>

      {/* 内容区 - 随内容自然高度伸展 */}
      <div className="p-5">
        <AnimatePresence mode="wait">
          {activeTab === 'milestone' && (
            <motion.div key="milestone" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {project.milestones?.length > 0 ? project.milestones.map((m: any) => (
                <div key={m.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between group/item">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-700 truncate">{m.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-1">{m.plannedDate ? new Date(m.plannedDate).toLocaleDateString() : '-'}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className={cn(
                      "text-[9px] font-black px-1.5 py-0.5 rounded uppercase",
                      m.status === '1' ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"
                    )}>{m.status === '1' ? t('project.task_board.done') : t('project.task_board.plan')}</span>
                  </div>
                </div>
              )) : <EmptyCardState text={t('project.task_board.no_milestones')} />}
            </motion.div>
          )}

          {activeTab === 'risk' && (
            <motion.div key="risk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {project.risks?.length > 0 ? project.risks.map((r: any) => (
                <div key={r.id} className="p-3 bg-rose-50/30 border border-rose-100/50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", r.level === 'high' || r.level === '1' ? "bg-rose-500 animate-pulse" : "bg-amber-500")} />
                      <h4 className="text-xs font-bold text-slate-700 truncate">{r.title}</h4>
                    </div>
                    <span className={cn("text-[9px] font-black px-2 py-0.5 rounded uppercase shrink-0 ml-2", r.status === 'closed' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white")}>
                      {t(`project.risk.status.${r.status}`) || r.status}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase">{r.ownerName || '-'} • {r.riskNo}</p>
                </div>
              )) : <EmptyCardState text={t('project.task_board.no_risks')} />}
            </motion.div>
          )}

          {activeTab === 'report' && (
            <motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {project.reports?.length > 0 ? project.reports.map((r: any) => (
                <div key={r.id} className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                     <FileText size={14} className="text-slate-400" />
                     <div>
                       <h4 className="text-xs font-bold text-slate-700 truncate max-w-[120px]">{r.name}</h4>
                       <p className="text-[9px] text-slate-400 uppercase font-mono">{t(`project.report.status.${r.status}`) || r.status}</p>
                     </div>
                  </div>
                  <div className="text-right shrink-0">
                     <p className="text-[10px] font-black text-slate-800">{r.verifiedCount}/{r.copies}</p>
                  </div>
                </div>
              )) : <EmptyCardState text={t('project.task_board.no_reports')} />}
            </motion.div>
          )}

          {activeTab === 'tag' && (
            <motion.div key="tag" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-2">
              {project.tags?.length > 0 ? project.tags.map((item: any) => (
                <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-transparent text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{item.tagType}</p>
                  <h4 className="text-lg font-black text-emerald-600">{item.taggedCount}</h4>
                </div>
              )) : <EmptyCardState text={t('project.task_board.no_tags')} />}
            </motion.div>
          )}

          {activeTab === 'expense' && (
            <motion.div key="expense" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase mb-1.5">
                    <span>{t('project.stats.spent')}</span>
                    <span>{Math.round((project.expenses?.total / project.budget) * 100) || 0}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (project.expenses?.total / project.budget) * 100)}%` }} />
                  </div>
                </div>
                <div className="flex justify-between items-end">
                   <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">{t('project.task_board.total_spent')}</p>
                      <p className="text-sm font-black text-slate-900">¥{project.expenses?.total?.toLocaleString()}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-1">{t('project.fields.budget')}</p>
                      <p className="text-xs font-bold text-slate-500">¥{project.budget?.toLocaleString()}</p>
                   </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function EmptyCardState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-slate-300">
      <p className="text-[10px] italic font-medium">{text}</p>
    </div>
  )
}
