import React from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  GitBranch, 
  RotateCcw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Calendar,
  ChevronDown
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ProcessInstance } from '../../hooks/useProcessInstance'

interface ProcessHeaderProps {
  instance: ProcessInstance
  onWithdraw: () => void
}

export default function ProcessHeader({ instance, onWithdraw }: ProcessHeaderProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
    'pending': { label: t('workflow.status.pending'), color: 'text-yellow-700', bgColor: 'bg-yellow-50', icon: Clock },
    'running': { label: t('workflow.status.running'), color: 'text-yellow-700', bgColor: 'bg-yellow-50', icon: Clock },
    'approved': { label: t('workflow.status.approved'), color: 'text-green-700', bgColor: 'bg-green-50', icon: CheckCircle },
    'rejected': { label: t('workflow.status.rejected'), color: 'text-red-700', bgColor: 'bg-red-50', icon: XCircle },
    'withdrawn': { label: t('workflow.status.withdrawn'), color: 'text-gray-700', bgColor: 'bg-gray-50', icon: RotateCcw },
    'completed': { label: t('workflow.status.completed'), color: 'text-green-700', bgColor: 'bg-green-50', icon: CheckCircle },
    'terminated': { label: t('workflow.status.terminated'), color: 'text-red-700', bgColor: 'bg-red-50', icon: XCircle },
    'skipped': { label: t('workflow.status.skipped'), color: 'text-gray-700', bgColor: 'bg-gray-50', icon: ChevronDown }
  }

  const statusConfig = STATUS_CONFIG[instance.status] || STATUS_CONFIG[instance.result || ''] || STATUS_CONFIG['pending']
  const StatusIcon = statusConfig.icon

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString(i18n.language, {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-semibold text-gray-900">{instance.title}</h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                <StatusIcon className="w-4 h-4" />
                {statusConfig.label}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4 text-gray-400" />
                {instance.initiator_name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                {formatDateTime(instance.start_time)}
              </span>
              <span className="font-mono text-xs bg-gray-50 px-1.5 py-0.5 rounded text-gray-400">#{instance.id.substring(0, 8).toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate(`/workflow/visualization/${instance.id}`)} 
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2 font-medium text-gray-700"
          >
            <GitBranch className="w-4 h-4" />
            {t('workflow.action.view_flow_chart')}
          </button>
          {instance.status === 'running' && (
            <button 
              onClick={onWithdraw} 
              className="px-4 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-all flex items-center gap-2 font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              {t('workflow.action.withdraw')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
