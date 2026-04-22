import React from 'react'
import { CheckCircle2, XCircle, Share2, ClipboardCopy, Send, Clock, User } from 'lucide-react'
import { formatDateTime } from '../../../types/workflow-instance'

interface TimelineLog {
  id: string
  nodeName: string
  operatorName: string
  action: string
  comment?: string
  created_at: string
  cooperateType?: number
}

interface WorkflowTimelineModernProps {
  logs: TimelineLog[]
  t: any
}

const ACTION_CONFIG: Record<string, { icon: any; color: string; labelKey: string }> = {
  'approved': { icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-emerald-500 bg-emerald-50', labelKey: 'workflow.log.approved' },
  'rejected': { icon: <XCircle className="w-5 h-5" />, color: 'text-rose-500 bg-rose-50', labelKey: 'workflow.log.rejected' },
  'transfer': { icon: <Share2 className="w-5 h-5" />, color: 'text-blue-500 bg-blue-50', labelKey: 'workflow.log.transfer' },
  'cc': { icon: <ClipboardCopy className="w-5 h-5" />, color: 'text-indigo-500 bg-indigo-50', labelKey: 'workflow.log.cc' },
  'started': { icon: <Send className="w-5 h-5" />, color: 'text-slate-500 bg-slate-50', labelKey: 'workflow.log.started' },
}

export const WorkflowTimelineModern: React.FC<WorkflowTimelineModernProps> = ({ logs, t }) => {
  return (
    <div className="relative space-y-8 pl-8">
      {/* Central Line */}
      <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-blue-500 via-emerald-500 to-gray-200" />

      {logs.map((log, index) => {
        // Handle both lowercase and actual standard codes if needed
        const action = log.action.toLowerCase()
        const config = ACTION_CONFIG[action] || { icon: <Clock className="w-5 h-5" />, color: 'text-gray-500 bg-gray-50', labelKey: 'workflow.log.pending' }

        return (
          <div key={log.id} className="relative animate-in slide-in-from-left duration-500" style={{ animationDelay: `${index * 100}ms` }}>
            {/* Node Icon */}
            <div className={`absolute -left-10 w-8 h-8 rounded-xl flex items-center justify-center shadow-lg border-2 border-white z-10 ${config.color}`}>
              {config.icon}
            </div>

            {/* Content Card (Glassmorphism) */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 transition-all hover:shadow-xl hover:translate-x-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-100 to-gray-50 flex items-center justify-center border border-gray-100 shadow-inner">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-800">{log.operatorName || 'System'}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.nodeName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${config.color}`}>
                     {t(config.labelKey)}
                   </span>
                   <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
                     {formatDateTime(log.created_at)}
                   </span>
                </div>
              </div>

              {log.comment && (
                <div className="relative mt-2 p-4 bg-slate-50/50 rounded-xl border border-slate-100/50 italic text-sm text-slate-600">
                  <div className="absolute top-0 left-4 -translate-y-1/2 w-4 h-2 bg-slate-50/50 clip-path-triangle" />
                  “{log.comment}”
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
