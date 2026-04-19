// ============================================================
// 📦 项目详情页 - 审批流 Tab
// 精简点：将主页面中最复杂的审批流交互逻辑（约 150 行）独立出来。
// 核心修复：修正了原代码中 L1988 处 JSX 结构断裂（多了个 </div>）的 Bug。
// ============================================================

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { History, GitBranch, CheckCircle, Clock, XCircle, ChevronUp, ChevronDown, Send } from 'lucide-react'
import { cn } from '../../utils/cn'
import type { WorkflowInstance, WorkflowTask, WorkflowLog, UserInfo } from '../../types/project'

interface ApprovalTabProps {
  workflowInstance: WorkflowInstance | null
  workflowTasks: WorkflowTask[]
  workflowLogs: WorkflowLog[]
  currentTask: WorkflowTask | null
  workflowLoading: boolean
  currentUser: UserInfo | null
  onApproveAction: (type: 'approve' | 'reject', comment: string) => Promise<boolean>
  onWithdraw: () => void
  onNavigateToNewRequest: () => void
}

export default function ApprovalTab({
  workflowInstance,
  workflowLogs,
  currentTask,
  workflowLoading,
  currentUser,
  onApproveAction,
  onWithdraw,
  onNavigateToNewRequest
}: ApprovalTabProps) {
  const { t } = useTranslation()
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showAllLogs, setShowAllLogs] = useState(false)

  const handleAction = async (type: 'approve' | 'reject') => {
    setSubmitting(true)
    const success = await onApproveAction(type, comment)
    if (success) {
      setComment('')
    }
    setSubmitting(false)
  }

  if (workflowLoading) {
    return (
      <div className="bg-white p-20 rounded-lg border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('common.loading')}</p>
      </div>
    )
  }

  if (!workflowInstance) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-slate-100 border-dashed">
        <GitBranch size={48} className="text-slate-200 mb-4" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">{t('project.no_related_workflow')}</p>
        <button
          onClick={onNavigateToNewRequest}
          className="px-6 py-2.5 bg-slate-900 text-white rounded-md font-bold text-[10px] uppercase tracking-widest shadow-md hover:bg-slate-800 transition-all flex items-center gap-2"
        >
          <Send size={14} /> {t('project.initiate_change_request')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 流程状态页眉 */}
      <div className="bg-white p-6 rounded-lg border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
            <GitBranch size={24} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 tracking-tight">{workflowInstance.title}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest tabular-nums">ID: {workflowInstance.id}</span>
              <div className="w-1 h-1 bg-slate-200 rounded-full" />
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{t('workflow.node')}: {workflowInstance.current_node_name || t('workflow.status.completed')}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn(
            "px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest",
            workflowInstance.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
            workflowInstance.status === 'rejected' ? 'bg-rose-50 text-rose-600' :
            'bg-blue-50 text-blue-600'
          )}>
            {workflowInstance.status === 'completed' ? t('workflow.status.completed') :
            workflowInstance.status === 'rejected' ? t('workflow.status.rejected') :
            workflowInstance.status === 'active' ? t('workflow.status.assigned') : workflowInstance.status}
          </span>
          {workflowInstance.initiator_id === currentUser?.id && workflowInstance.status === 'active' && (
            <button
              onClick={onWithdraw}
              className="px-3 py-1 bg-white text-amber-600 border border-amber-200 rounded text-[10px] font-bold uppercase tracking-wider hover:bg-amber-50 shadow-sm transition-all"
            >
              {t('workflow.action.withdraw')}
            </button>
          )}
        </div>
      </div>

      {/* 当前待办任务区 */}
      {currentTask && (
        <div className="bg-slate-900 rounded-lg border-none p-8 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-blue-500/10 group-hover:scale-125 transition-transform duration-700">
            <CheckCircle size={100} />
          </div>
          <div className="relative z-10 space-y-6">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-[0.3em] flex items-center gap-2">
              <Clock size={14} /> {t('workflow.node')}: {currentTask.name}
            </h4>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{t('workflow.comment')}</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-sm font-bold text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder={t('workflow.placeholder.comment') || 'Comments...'}
                  rows={4}
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleAction('approve')}
                  disabled={submitting}
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-md font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-emerald-600/10"
                >
                  <CheckCircle size={18} />
                  {t('workflow.action.approve')}
                </button>
                <button
                  onClick={() => handleAction('reject')}
                  disabled={submitting}
                  className="flex-1 bg-rose-600 text-white py-3 rounded-md font-bold text-xs uppercase tracking-widest hover:bg-rose-700 flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-rose-600/10"
                >
                  <XCircle size={18} />
                  {t('workflow.action.reject')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 审批历史记录 */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <History size={16} className="text-slate-300" />
          {t('workflow.log')}
        </h4>

        <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-slate-200">
          {(showAllLogs ? workflowLogs : workflowLogs.slice(0, 3)).map((log) => (
            <div key={log.id} className="relative pl-8">
              <div className={cn(
                "absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white z-10",
                log.action === 'approve' || log.action === 'start' ? 'bg-emerald-500' :
                log.action === 'reject' ? 'bg-rose-500' :
                log.action === 'withdraw' ? 'bg-amber-500' : 'bg-blue-500'
              )} />
              <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-slate-900 transition-colors uppercase tracking-tight">{log.node_name || t('project.node_branch')}</span>
                  <span className="text-[9px] font-bold text-slate-300 tabular-nums">{new Date(log.created_at).toLocaleString()}</span>
                </div>
                <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider flex items-center gap-2">
                  {log.operator_name || 'SYSTEM'} :
                  <span className={cn(
                    "uppercase tracking-[0.2em] font-black",
                    log.action === 'approve' ? 'text-emerald-600' :
                    log.action === 'reject' ? 'text-rose-600' : 'text-emerald-600'
                  )}>
                    {log.action === 'start' ? t('workflow.action.submit') :
                    log.action === 'approve' ? t('workflow.action.approve') :
                    log.action === 'reject' ? t('workflow.action.reject') :
                    log.action === 'withdraw' ? t('workflow.action.withdraw') : log.action}
                  </span>
                </div>
                {log.comment && (
                  <div className="mt-3 bg-slate-50 p-4 rounded-md text-xs font-bold text-slate-600 italic border-l-4 border-slate-200 leading-relaxed shadow-inner">
                    {log.comment}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {workflowLogs.length > 3 && (
          <button
            onClick={() => setShowAllLogs(!showAllLogs)}
            className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all bg-white rounded-lg border border-slate-100"
          >
            {showAllLogs ? (
              <>{t('workflow.log_history_hide')} <ChevronUp size={14} /></>
            ) : (
              <>{t('workflow.log_history_show', { count: workflowLogs.length })} <ChevronDown size={14} /></>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
