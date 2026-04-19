// ============================================================
// 📦 WBS 浏览器组件
// 精简点：将主页面中复杂的 WBS 任务表（约 80 行）抽离
//         包含 WBS 代码排序、层级缩进展示和进度条
// ============================================================

import React from 'react'
import { useTranslation } from 'react-i18next'
import { List } from 'lucide-react'
import { cn } from '../../utils/cn'
import type { Task } from '../../types/project'
import { formatDate } from '../../types/project'

interface WBSExplorerProps {
  tasks: Task[]
}

export default function WBSExplorer({ tasks }: WBSExplorerProps) {
  const { t } = useTranslation()

  if (tasks.length === 0) return null

  // 按 WBS 代码排序
  const sortedTasks = [...tasks].sort((a, b) => a.wbs_code.localeCompare(b.wbs_code))

  return (
    <div className="mt-8 pt-8 border-t border-slate-100">
      <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center justify-between">
         WBS {t('project.milestone.explorer') || 'Work Breakdown Structure'}
         <div className="flex gap-1.5 items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[9px] font-bold text-slate-400 capitalize">{tasks.length} {t('project.milestone.total_tasks') || 'Tasks Total'}</span>
         </div>
      </h4>
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
         <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
               <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('project.milestone.wbs_code') || 'WBS'}</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.name')}</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.status')}</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.progress')}</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('project.fields.period')}</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {sortedTasks.map(task => {
                  const depth = (task.wbs_code.match(/\./g) || []).length
                  return (
                     <tr key={task.id} className="hover:bg-slate-50/50 transition-colors group/wbs">
                        <td className="px-6 py-4">
                           <span className="text-[10px] font-black text-slate-400 tabular-nums">
                              {task.wbs_code}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3" style={{ paddingLeft: `${depth * 20}px` }}>
                              {depth > 0 && <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />}
                              <span className={cn(
                                 "text-[12px] font-bold tracking-tight uppercase",
                                 depth === 0 ? "text-slate-900" : "text-slate-600"
                              )}>
                                 {task.name}
                              </span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className={cn(
                              "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest",
                              task.status === 'completed' ? "bg-emerald-50 text-emerald-600" : 
                              task.status === 'in_progress' ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
                           )}>
                              {t(`project.status.${task.status}`) || task.status}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                              <div className="flex-1 min-w-[60px] bg-slate-100 h-1.5 rounded-full overflow-hidden shadow-inner uppercase tracking-wider">
                                 <div 
                                    className={cn(
                                       "h-full transition-all duration-1000",
                                       task.status === 'completed' ? "bg-emerald-500" : "bg-emerald-600"
                                    )}
                                    style={{ width: `${task.progress}%` }}
                                 />
                              </div>
                              <span className="text-[10px] font-black text-slate-900 tabular-nums">{task.progress}%</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="text-[10px] font-bold text-slate-400 tabular-nums">
                              {formatDate(task.planned_start_date)} <span className="text-slate-200">~</span> {formatDate(task.planned_end_date)}
                           </div>
                        </td>
                     </tr>
                  )
               })}
            </tbody>
         </table>
      </div>
    </div>
  )
}
