import React from 'react'
import { Clock, User, History, CheckCircle2, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../utils/cn'
import FormTemplateRenderer from './FormTemplateRenderer'
import { getOrderTypeConfigs } from '../../constants/workflowConstants'

interface FlowDetailViewProps {
  title: string
  processTitle?: string
  initiatorName?: string
  createdAt?: string | null
  nodeName?: string
  currentNodeName?: string
  orderType?: string
  handlerName?: string
  formTemplate?: any
  formData?: any
  readOnly?: boolean
  timeline?: any[]
  showTimeline?: boolean
  children?: React.ReactNode
}

const TimelineItem: React.FC<{ item: any; isLast?: boolean }> = ({ item, isLast }) => {
  const { t } = useTranslation()
  return (
    <div className="relative z-10 pl-10">
      <div className={cn(
        "absolute left-0 top-1 w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center",
        item.skip_type === 'pass' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
      )}>
        {item.skip_type === 'pass' ? <CheckCircle2 size={8} /> : <AlertCircle size={8} />}
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-slate-800 tracking-tight">{item.node_name}</span>
          <span className="text-[10px] text-slate-400 font-mono">
            {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 mb-2">{t('workflow.fields.handler')}: {item.approver || '-'}</div>
        {item.message && (
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[10px] text-slate-500 italic">
            "{item.message}"
          </div>
        )}
      </div>
    </div>
  )
}

export default function FlowDetailView({
  title,
  processTitle,
  initiatorName,
  createdAt,
  nodeName,
  currentNodeName,
  orderType,
  handlerName,
  formTemplate,
  formData = {},
  readOnly = false,
  timeline = [],
  showTimeline = true,
  children
}: FlowDetailViewProps) {
  const { t } = useTranslation()
  const orderTypeConfigs = getOrderTypeConfigs(t)
  const orderTypeLabel = orderType ? (orderTypeConfigs[orderType]?.label || orderType) : ''

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleDateString()
  }

  const formatDateTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleString()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="mb-6 pb-4 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">
              {processTitle || title}
            </h2>
            <div className="flex items-center gap-6 text-xs text-slate-500">
              {initiatorName && (
                <span className="flex items-center gap-1.5">
                  <User size={12} className="text-slate-400" />
                  <span className="font-medium">{t('workflow.fields.initiator')}:</span>
                  <span className="text-slate-700">{initiatorName}</span>
                </span>
              )}
              {createdAt && (
                <span className="flex items-center gap-1.5">
                  <Clock size={12} className="text-slate-400" />
                  <span className="font-medium">{t('workflow.fields.time')}:</span>
                  <span className="text-slate-700">{formatDateTime(createdAt)}</span>
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t('workflow.fields.current_node')}</p>
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Clock size={12} className="text-indigo-500" />
                {nodeName || currentNodeName || '-'}
              </div>
            </div>
            {handlerName && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t('workflow.fields.handler')}</p>
                <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <User size={12} className="text-indigo-500" />
                  {handlerName}
                </div>
              </div>
            )}
            {orderTypeLabel && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t('workflow.fields.type')}</p>
                <div className="font-bold text-slate-900 text-sm">{orderTypeLabel}</div>
              </div>
            )}
            {createdAt && (
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t('workflow.fields.created_at')}</p>
                <div className="font-bold text-slate-900 text-sm">{formatDate(createdAt)}</div>
              </div>
            )}
          </div>

          {formTemplate ? (
            <FormTemplateRenderer
              template={formTemplate}
              initialData={formData}
              readOnly={readOnly}
              onDataChange={() => {}}
            />
          ) : (
            <div className="p-10 text-center text-slate-400 border border-dashed border-slate-200 rounded-lg text-sm">
              {t('workflow.no_definition', 'No form template configured for this step')}
            </div>
          )}

          {children}
        </div>
      </div>

      {showTimeline && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 mb-6">
              <History size={14} className="text-slate-400" />
              {t('workflow.timeline', 'Timeline')}
            </h3>
            <div className="space-y-6 relative before:absolute before:inset-0 before:left-2 before:w-px before:bg-slate-100 before:z-0">
              {timeline.length === 0 && (
                <p className="text-[10px] text-slate-400 pl-8 italic">{t('workflow.no_records', 'No records yet')}</p>
              )}
              {timeline.map((item, i) => (
                <TimelineItem key={i} item={item} />
              ))}

              {currentNodeName && (
                <div className="relative z-10 pl-8 opacity-60">
                  <div className="absolute left-0 top-1 w-5 h-5 rounded-full border-2 border-white shadow-sm bg-indigo-500 text-white flex items-center justify-center">
                    <Clock size={8} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-indigo-600 tracking-tight">{currentNodeName}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{t('workflow.waiting', 'Waiting for decision...')}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
