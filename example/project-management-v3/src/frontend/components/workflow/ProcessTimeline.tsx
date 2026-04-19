import React, { useState } from 'react'
import { History, ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ExecutionLog } from '../../hooks/useProcessInstance'

interface ProcessTimelineProps {
  logs: ExecutionLog[]
}

export default function ProcessTimeline({ logs }: ProcessTimelineProps) {
  const { t, i18n } = useTranslation()
  const [showAllLogs, setShowAllLogs] = useState(false)

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString(i18n.language, {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    })
  }

  if (logs.length === 0) return null

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div 
        className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between cursor-pointer group"
        onClick={() => setShowAllLogs(!showAllLogs)}
      >
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <History className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
          {t('workflow.action_logs.title')}
        </h3>
        {showAllLogs ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </div>
      
      <div className={`divide-y divide-gray-50 transition-all duration-300 ${showAllLogs ? '' : 'max-h-64 overflow-hidden relative'}`}>
        {!showAllLogs && logs.length > 5 && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        )}
        
        {logs.slice().reverse().map((log, idx) => (
          <div key={log.id || idx} className="px-6 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors">
            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 shadow-sm border-2 border-white ${
              log.action === 'task_complete' && log.status === 'approved' ? 'bg-green-500' :
              log.action === 'task_complete' && log.status === 'rejected' ? 'bg-red-500' :
              log.action === 'process_start' ? 'bg-blue-500' : 'bg-gray-400'
            }`} />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-900 text-sm">
                  {log.node_name || log.node_id || t('workflow.action.process_start')}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm ${
                  log.status === 'approved' ? 'bg-green-100 text-green-700' :
                  log.status === 'rejected' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {log.action === 'process_start' ? t('workflow.action.initiate') :
                    log.status === 'approved' ? t('workflow.action.approve') :
                    log.status === 'rejected' ? t('workflow.action.reject') :
                    log.status === 'skipped' ? t('workflow.action.skip') : log.status}
                </span>
              </div>
              {log.comment && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-gray-600 italic">
                  "{log.comment}"
                </div>
              )}
              <div className="text-[11px] text-gray-400 font-medium flex items-center gap-2">
                <span className="text-gray-900 font-bold">{log.operator_name}</span>
                <span>·</span>
                <span>{formatDateTime(log.created_at)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {!showAllLogs && logs.length > 5 && (
        <button 
          onClick={() => setShowAllLogs(true)}
          className="w-full py-3 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors border-t border-gray-50"
        >
          {t('common.show_more')} ({logs.length})
        </button>
      )}
    </div>
  )
}
