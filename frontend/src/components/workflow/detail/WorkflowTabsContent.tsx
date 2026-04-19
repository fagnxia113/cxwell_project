import React, { useState } from 'react'
import { History, ChevronUp, ChevronDown, CheckCircle, Clock, GitBranch } from 'lucide-react'
import { WorkflowLog, WorkflowTask, getStatusConfig, formatDateTime, formatDate, formatTime } from '../../../types/workflow-instance'

interface WorkflowTabsContentProps {
  activeTab: 'form' | 'workflow' | 'history'
  instance: any
  tasks: WorkflowTask[]
  logs: WorkflowLog[]
  definition: any
  t: any
  renderFormTab: () => React.ReactNode
}

export const WorkflowTabsContent: React.FC<WorkflowTabsContentProps> = ({
  activeTab,
  instance,
  tasks,
  logs,
  definition,
  t,
  renderFormTab
}) => {
  const [showAllLogs, setShowAllLogs] = useState(false)

  if (activeTab === 'form') {
    return renderFormTab()
  }

  if (activeTab === 'workflow') {
    const completedTasks = tasks.filter(t => t.status === 'completed')
    const pendingTasks = tasks.filter(t => t.status === 'assigned' || t.status === 'in_progress')
    const totalTasks = tasks.length
    const completedCount = completedTasks.length

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-gray-400" />
            {t('workflow.process_status')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="text-xs text-gray-500 mb-1">{t('workflow.status.label')}</div>
              <div className="font-bold text-gray-900">
                {getStatusConfig(t)[instance.status]?.label || instance.status}
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="text-xs text-gray-500 mb-1">{t('workflow.initiator')}</div>
              <div className="font-bold text-gray-900 flex items-center gap-2">
                {instance.initiator_name}
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="text-xs text-gray-500 mb-1">{t('workflow.node')}</div>
              <div className="font-bold text-gray-900 truncate">
                {instance.current_node_name || '-'}
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="text-xs text-gray-500 mb-1">{t('common.startTime')}</div>
              <div className="font-bold text-gray-900 text-sm">
                {formatDate(instance.start_time)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-gray-400" />
            {t('workflow.progress')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            {[ 
              { label: t('workflow.total_phases'), value: totalTasks, color: 'text-gray-900' },
              { label: t('workflow.status.completed'), value: completedCount, color: 'text-emerald-600' },
              { label: t('workflow.status.pending'), value: pendingTasks.length, color: 'text-amber-600' },
              { label: t('common.remaining'), value: totalTasks - completedCount - pendingTasks.length, color: 'text-gray-400' }
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
                <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-700">{t('workflow.progress')}</span>
              <span className="text-sm font-black text-blue-600">{totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Node Log list */}
        {tasks.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
              <History className="w-5 h-5 text-gray-400" />
              {t('workflow.log')}
            </h3>
            <div className="space-y-4">
              {tasks.map((task, index) => (
                <div
                  key={task.id}
                  className={`flex items-start gap-4 p-5 rounded-xl border transition-all ${task.status === 'completed'
                      ? 'bg-emerald-50/50 border-emerald-100 shadow-sm'
                      : task.status === 'assigned'
                        ? 'bg-blue-50 border-blue-200 shadow-md scale-[1.02]'
                        : 'bg-white border-gray-100 opacity-60'
                    }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${task.status === 'completed'
                      ? 'bg-emerald-500 text-white'
                      : task.status === 'assigned'
                        ? 'bg-blue-500 text-white animate-pulse'
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                    {task.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-black">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-bold text-gray-900 text-lg">{task.name}</div>
                      <div className="text-xs font-medium text-gray-400">{task.completed_at ? formatDate(task.completed_at) : formatDate(task.created_at)}</div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm text-gray-500">{t('workflow.assignee')}:</span>
                      <span className="text-sm font-bold text-gray-700">{task.assignee_name}</span>
                      {task.status === 'completed' && task.result && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${task.result === 'approved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                          }`}>
                          {task.result === 'approved' ? t('workflow.status.approved') : t('workflow.status.rejected')}
                        </span>
                      )}
                    </div>
                    {task.comment && (
                      <div className="bg-white/80 border border-gray-100 p-3 rounded-lg text-sm text-gray-700 shadow-inner italic">
                         “{task.comment}”
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (activeTab === 'history') {
    const displayLogs = showAllLogs ? logs : logs.slice(0, 5)
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
            <History className="w-5 h-5 text-gray-400" />
            {t('workflow.history')}
          </h3>
          {logs.length > 0 ? (
            <div className="space-y-0 relative">
              {/* Timeline vertical line */}
              <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-gray-200" />
              
              {displayLogs.map((log, index) => (
                <div key={`${log.id}-${index}`} className="flex gap-6 pb-8 relative group">
                  <div className={`z-10 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ring-4 ring-gray-50 ${
                    log.action === 'approved' ? 'bg-emerald-500' :
                    log.action === 'rejected' ? 'bg-rose-500' :
                    log.action === 'withdrawn' ? 'bg-slate-500' :
                    'bg-blue-500'
                  }`} />
                  
                  <div className="flex-1 -mt-1">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{log.operator_name || t('workflow.system')}</span>
                        <span className="text-xs text-gray-400">@{log.node_name || 'System'}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100">
                        {formatDateTime(log.created_at)}
                      </span>
                    </div>
                    
                    <div className={`inline-block px-3 py-1 rounded-lg text-sm font-bold mb-2 shadow-sm ${
                      log.action === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                      log.action === 'rejected' ? 'bg-rose-50 text-rose-700' :
                      'bg-blue-50 text-blue-700'
                    }`}>
                      {log.action === 'approved' && t('workflow.log.approved')}
                      {log.action === 'rejected' && t('workflow.log.rejected')}
                      {log.action === 'withdrawn' && t('workflow.log.withdrawn')}
                      {log.action === 'started' && t('workflow.log.started')}
                      {log.action === 'completed' && t('workflow.log.completed')}
                      {log.action === 'terminated' && t('workflow.log.terminated')}
                      {log.action === 'node_skip' && t('workflow.log.node_skip')}
                    </div>

                    {log.comment && (
                      <div className="text-sm text-gray-600 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                        {log.comment}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-12 border-2 border-dashed border-gray-200 rounded-xl">
              {t('workflow.no_history')}
            </div>
          )}
          
          {logs.length > 5 && (
            <button
              onClick={() => setShowAllLogs(!showAllLogs)}
              className="mt-4 w-full py-3 text-sm font-bold text-blue-600 hover:text-blue-700 bg-white border border-gray-200 rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-md"
            >
              {showAllLogs ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  {t('common.collapse')}
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  {t('common.view_all')} {logs.length} {t('common.records')}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    )
  }

  return null
}
