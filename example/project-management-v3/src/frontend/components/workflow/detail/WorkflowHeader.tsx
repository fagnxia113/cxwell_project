import React from 'react'
import { ArrowLeft, User, Calendar, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { WorkflowInstance, WorkflowTask, getStatusConfig, getProcessTypeLabels, formatDate } from '../../../types/workflow-instance'

interface WorkflowHeaderProps {
  instance: WorkflowInstance
  currentTask: WorkflowTask | null
  currentUserId: string
  t: any
  onActionClick: (type: string) => void
  onWithdraw: () => void
  nodeActions: any[]
}

export const WorkflowHeader: React.FC<WorkflowHeaderProps> = ({
  instance,
  currentTask,
  currentUserId,
  t,
  onActionClick,
  onWithdraw,
  nodeActions
}) => {
  const navigate = useNavigate()
  const statusConfig = getStatusConfig(t)[instance.status] || getStatusConfig(t)['pending']
  const StatusIcon = statusConfig.icon

  return (
    <div className="mb-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        {t('common.back')}
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.bgColor} ${statusConfig.color}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {statusConfig.label}
              </span>
              <span className="text-sm font-medium text-gray-400">
                {getProcessTypeLabels(t)[instance.definition_key] || instance.definition_key}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">{instance.title}</h1>
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span className="font-medium text-gray-700">{instance.initiator_name}</span>
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                {formatDate(instance.start_time)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {currentTask && nodeActions.map((action: any) => (
              <button
                key={action.type}
                onClick={() => onActionClick(action.type)}
                className={`px-5 py-2.5 text-white rounded-lg hover:brightness-110 active:scale-95 transition-all duration-200 flex items-center gap-2 shadow-sm font-medium ${action.className}`}
              >
                {action.icon}
                {action.label}
              </button>
            ))}

            {instance.status === 'running' && !currentTask && currentUserId === instance.initiator_id && (
              <button
                onClick={onWithdraw}
                className="px-5 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 active:scale-95 transition-all duration-200 flex items-center gap-2 shadow-sm font-medium"
              >
                <RotateCcw className="w-4 h-4" />
                {t('workflow.action.withdraw')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
