import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Layout,
  Calendar,
  AlertTriangle,
  FileText,
  CheckCircle2,
  ArrowRight,
  Search,
  MoreHorizontal,
  User,
  Tag,
  Zap
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'
import { useFetch } from '../../hooks/useReactQuery'
import { apiClient } from '../../utils/apiClient'
import { useMessage } from '../../hooks/useMessage'

export default function TaskBoardPage() {
  const { t } = useTranslation()
  const { success, error: showError } = useMessage()
  const [filterType, setFilterType] = useState<string>('all')

  const { data: boardData, isLoading, refetch } = useFetch(
    ['task-board'],
    '/api/projects/extensions/task-board'
  )

  const handleCloseTask = async (task: any) => {
    try {
      if (task.type === 'risk') {
        await apiClient.put(`/api/projects/extensions/risks/${task.id}`, { status: 'closed' })
      } else if (task.type === 'milestone') {
        await apiClient.put(`/api/milestones/${task.id}/progress`, {
          progress: 100,
          status: 'completed',
          actual_end_date: new Date().toISOString().split('T')[0]
        })
      }
      success(t('common.success'))
      refetch()
    } catch (err: any) {
      showError(err.message || t('common.error'))
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mesh">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const tasks = boardData?.data || { milestones: [], risks: [] }
  const allTasks = [
    ...tasks.milestones.map((m: any) => ({ ...m, type: 'milestone' })),
    ...tasks.risks.map((r: any) => ({ ...r, type: 'risk' }))
  ].filter((task: any) => filterType === 'all' || task.type === filterType)

  return (
    <div className="min-h-screen bg-mesh p-4 lg:p-6 space-y-4 animate-fade-in custom-scrollbar">
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-2xl font-bold text-slate-700 flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg text-white shadow-brand">
              <Layout size={20} strokeWidth={2.5} />
            </div>
            {t('project.task_board.title') || '任务看板'}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('project.task_board.desc') || '管理里程碑、报告和风险'}</p>
        </motion.div>

        <div className="flex items-center gap-4">
          <div className="bg-white/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span className="text-xs font-medium text-slate-500">{t('common.total')}: <span className="font-bold text-slate-700">{allTasks.length}</span></span>
              </div>
              <div className="w-px h-4 bg-slate-200"></div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-xs font-medium text-slate-500">{t('project.tabs.risks')}: <span className="font-bold text-amber-600">{tasks.risks.length}</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Intelligence Filter Bar */}
      <div className="premium-card p-4 flex flex-wrap items-center gap-4">
        <div className="flex bg-slate-100/50 p-1 rounded-xl gap-1">
          {[
            { id: 'all', label: '全部', icon: Tag },
            { id: 'milestone', label: '里程碑', icon: Calendar },
            { id: 'risk', label: '风险', icon: AlertTriangle },
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setFilterType(filter.id)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-2",
                filterType === filter.id ? "bg-primary text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <filter.icon size={14} />
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {allTasks.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-xl border border-slate-100 border-dashed">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={24} className="text-slate-200" />
            </div>
            <p className="text-slate-400 text-sm font-medium">暂无任务</p>
          </div>
        ) : (
          allTasks.map((task: any, idx: number) => (
            <motion.div
              key={`${task.type}-${task.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 }}
              className="premium-card p-5 hover:shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  task.type === 'milestone' ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                )}>
                  {task.type === 'milestone' ? <Calendar size={18} /> : <AlertTriangle size={18} />}
                </div>
                <button className="p-1.5 text-slate-300 hover:text-slate-600 transition-colors">
                  <MoreHorizontal size={16} />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                    task.type === 'milestone' ? "text-blue-500 border-blue-100" : "text-amber-500 border-amber-100"
                  )}>
                    {task.type === 'milestone' ? '里程碑' : '风险'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-800 group-hover:text-primary transition-colors">
                  {task.title}
                </h3>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">项目</span>
                  <span className="font-bold text-slate-600">{task.projectName || '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">截止日期</span>
                  <span className={cn(
                    "font-bold",
                    task.type === 'risk' ? "text-rose-500" : "text-slate-600"
                  )}>
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center">
                    <User size={12} className="text-primary" />
                  </div>
                </div>

                <button
                  onClick={() => handleCloseTask(task)}
                  className="px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary/90 transition-all flex items-center gap-1.5"
                >
                  <ArrowRight size={12} /> 关闭
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
