import React, { useState, useRef, useEffect } from 'react'
import { ArrowLeft, User, Calendar, RotateCcw, ChevronLeft, Hash, Clock, MoreHorizontal, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { WorkflowInstance, WorkflowTask, getStatusConfig, getProcessTypeLabels, formatDate } from '../../../types/workflow-instance'

interface WorkflowHeaderProps {
  instance: WorkflowInstance
  processTitle?: string
  currentTask: WorkflowTask | null
  currentUserId: string
  t: any
  onActionClick: (type: string) => void
  onWithdraw: () => void
  nodeActions: any[]
  documentNo?: string
  applyDate?: string
  applicantName?: string
  activeActionType?: string
}

export const WorkflowHeader: React.FC<WorkflowHeaderProps> = ({
  instance,
  processTitle,
  currentTask,
  currentUserId,
  t,
  onActionClick,
  onWithdraw,
  nodeActions,
  documentNo,
  applyDate,
  applicantName,
  activeActionType
}) => {
  const navigate = useNavigate()
  const statusConfig = getStatusConfig(t)[instance.status] || getStatusConfig(t)['pending']
  const StatusIcon = statusConfig.icon
  
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const mainActions = nodeActions.filter(a => a.type === 'approve' || a.type === 'reject')
  const moreActions = nodeActions.filter(a => a.type !== 'approve' && a.type !== 'reject')

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-all text-sm"
        >
          <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center group-hover:border-slate-300 group-hover:bg-slate-50 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          {t('common.back')}
        </button>

        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
          ID: {instance.id?.substring(0, 8)}
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100/80 p-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${statusConfig.bgColor} ${statusConfig.color}`}>
                <StatusIcon className="w-3 h-3" />
                {statusConfig.label}
              </span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-medium">
                {getProcessTypeLabels(t)[instance.definition_key] || instance.definition_key}
              </span>
            </div>

            <h1 className="text-lg font-semibold text-slate-900 leading-tight">
              {processTitle || instance.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center ring-2 ring-white">
                  <User className="w-3 h-3 text-emerald-600" />
                </div>
                <span className="text-slate-700">{applicantName || instance.initiator_name}</span>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {applyDate || formatDate(instance.start_time)}
              </span>
              {documentNo && (
                <span className="flex items-center gap-1">
                  <Hash className="w-3 h-3 text-slate-400" />
                  <span className="font-mono text-slate-400">{documentNo}</span>
                </span>
              )}
              {instance.current_node_name && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md border border-blue-100/50 text-xs">
                  <Clock className="w-3 h-3" />
                  <span className="font-semibold">{instance.current_node_name}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Primary Actions (Approve/Reject) */}
            {currentTask && mainActions.map((action: any) => (
              <button
                key={action.type}
                onClick={() => onActionClick(action.type)}
                className={`px-4 py-1.5 text-white rounded-lg hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-1.5 text-xs font-semibold ${action.className} ${activeActionType === action.type ? 'ring-2 ring-offset-1 ring-slate-200' : ''}`}
              >
                {action.icon}
                {action.label}
              </button>
            ))}

            {/* More Actions Dropdown */}
            {currentTask && moreActions.length > 0 && (
              <div ref={moreRef} className="relative">
                <button
                  onClick={() => setIsMoreOpen(!isMoreOpen)}
                  className={`px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all text-xs font-medium flex items-center gap-1 ${isMoreOpen ? 'bg-slate-200 ring-1 ring-slate-300' : ''}`}
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                  {t('common.more') || '更多'}
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isMoreOpen ? 'rotate-180' : ''}`} />
                </button>

                {isMoreOpen && (
                  <div className="absolute right-0 mt-1.5 w-44 bg-white/95 backdrop-blur rounded-lg shadow-lg border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    {moreActions.map((action: any) => (
                      <button
                        key={action.type}
                        onClick={() => {
                          onActionClick(action.type)
                          setIsMoreOpen(false)
                        }}
                        className={`w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 transition-colors group ${activeActionType === action.type ? 'bg-slate-50' : ''}`}
                      >
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center text-white ${action.className}`}>
                          {action.icon}
                        </div>
                        <span className="font-medium text-slate-700 text-xs">{action.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Withdraw Button */}
            {instance.status === 'running' && !currentTask && currentUserId === instance.initiator_id && (
              <button
                onClick={onWithdraw}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-1.5 text-xs font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                {t('workflow.action.withdraw')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
