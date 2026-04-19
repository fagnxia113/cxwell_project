import React from 'react'
import { ProcessInstance, Task } from '../../hooks/useProcessInstance'
import { useTranslation } from 'react-i18next'
import { Clock, CheckCircle } from 'lucide-react'

interface ProcessTaskSidebarProps {
  instance: ProcessInstance
  tasks: Task[]
}

export default function ProcessTaskSidebar({ instance, tasks }: ProcessTaskSidebarProps) {
  const { t, i18n } = useTranslation()

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString(i18n.language, {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="space-y-4">
      {/* 状态总览卡片 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:bg-slate-50/50">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{t('workflow.status.title')}</h3>
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{t('workflow.fields.current_node')}</span>
            <span className="text-sm font-black text-gray-900 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {instance.current_node_name || (instance.status === 'completed' ? t('workflow.status.completed') : '-')}
            </span>
          </div>
          
          {instance.end_time && (
            <div className="flex flex-col gap-1 pt-2 border-t border-gray-100">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{t('workflow.fields.completion_time')}</span>
              <span className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                {formatDateTime(instance.end_time)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 任务记录列表 */}
      {tasks.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-hidden">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{t('workflow.task_list.title')}</h3>
          <div className="space-y-3">
            {tasks.map(task => (
              <div key={task.id} className="group relative flex items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-100 transition-all hover:bg-white hover:border-blue-100 hover:shadow-sm">
                <div className="space-y-0.5">
                  <div className="text-xs font-black text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{task.name}</div>
                  <div className="text-[10px] font-bold text-gray-400">{task.assignee_name}</div>
                </div>
                <span className={`px-2 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider ${
                  task.status === 'completed' 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                  : task.status === 'assigned' ? 'bg-amber-50 text-amber-600 border-amber-100' 
                  : 'bg-gray-100 text-gray-500 border-gray-100'
                }`}>
                  {task.status === 'completed' ? t('workflow.status.completed') : t('workflow.status.pending')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
