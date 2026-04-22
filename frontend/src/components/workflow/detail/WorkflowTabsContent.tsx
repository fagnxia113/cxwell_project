import React from 'react'
import { History, CheckCircle, GitBranch } from 'lucide-react'
import { WorkflowLog, WorkflowTask, getStatusConfig, formatDate } from '../../../types/workflow-instance'
import { WorkflowTimelineModern } from '../modern/WorkflowTimelineModern'
import { WorkflowPredictor } from '../modern/WorkflowPredictor'

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
        <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-500" />
            {t('workflow.process_status')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">{t('workflow.status.label')}</div>
              <div className="font-bold text-slate-800">
                {getStatusConfig(t)[instance.status]?.label || instance.status}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">{t('workflow.initiator')}</div>
              <div className="font-bold text-slate-800 truncate">
                {instance.initiator_name}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">{t('workflow.node')}</div>
              <div className="font-bold text-blue-600 truncate">
                {instance.current_node_name || '-'}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">{t('common.startTime')}</div>
              <div className="font-bold text-slate-800 text-sm">
                {formatDate(instance.start_time)}
              </div>
            </div>
          </div>
        </div>

        {/* Path Prediction Section */}
        {instance.status === 'running' && (
          <WorkflowPredictor 
            instanceId={instance.id} 
            variables={instance.variables} 
            t={t} 
          />
        )}

        <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            {t('workflow.progress')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[ 
              { label: t('workflow.total_phases'), value: totalTasks, color: 'text-slate-800' },
              { label: t('workflow.status.completed'), value: completedCount, color: 'text-emerald-600' },
              { label: t('workflow.status.pending'), value: pendingTasks.length, color: 'text-amber-600' },
              { label: t('common.remaining'), value: Math.max(0, totalTasks - completedCount - pendingTasks.length), color: 'text-slate-400' }
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
                <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3 text-xs uppercase font-black tracking-widest">
              <span className="text-slate-500">{t('workflow.progress')}</span>
              <span className="text-blue-600">{totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                style={{ width: `${totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (activeTab === 'history') {
    return (
      <div className="animate-in fade-in duration-500 py-4">
        {logs.length > 0 ? (
          <WorkflowTimelineModern 
            logs={logs.map(log => ({
              id: log.id,
              nodeName: log.node_name || 'System',
              operatorName: log.operator_name || 'System',
              action: log.action,
              comment: log.comment,
              created_at: log.created_at
            }))} 
            t={t} 
          />
        ) : (
          <div className="text-center text-slate-400 py-20 border-2 border-dashed border-slate-100 rounded-3xl">
            <History className="w-12 h-12 mx-auto mb-4 opacity-10" />
            <p className="font-bold italic uppercase tracking-widest text-xs">{t('workflow.no_history')}</p>
          </div>
        )}
      </div>
    )
  }

  return null
}
