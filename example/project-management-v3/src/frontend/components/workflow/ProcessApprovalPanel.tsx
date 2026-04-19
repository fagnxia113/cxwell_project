import React, { useState } from 'react'
import { CheckCircle, XCircle, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useMessage } from '../../hooks/useMessage'

interface ProcessApprovalPanelProps {
  onComplete: (action: 'approve' | 'reject', comment: string) => Promise<boolean>
}

export default function ProcessApprovalPanel({ onComplete }: ProcessApprovalPanelProps) {
  const { t } = useTranslation()
  const { warning } = useMessage()
  
  const [actionType, setActionType] = useState<'approve' | 'reject' | ''>('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!actionType) return

    if (actionType === 'reject' && !comment.trim()) {
      warning(t('workflow.error.reject_reason_required'))
      return
    }

    try {
      setSubmitting(true)
      const success = await onComplete(actionType, comment)
      if (success) {
        setComment('')
        setActionType('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-blue-50 p-6 animate-fade-in">
      <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Send className="w-4 h-4 text-blue-500" />
        {t('workflow.action.approval_panel')}
      </h3>
      
      <div className="space-y-4">
        {/* 操作切换 */}
        <div className="flex gap-2">
          <button 
            onClick={() => setActionType('approve')} 
            className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              actionType === 'approve' 
              ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' 
              : 'border-gray-100 text-gray-400 hover:border-gray-200 hover:bg-gray-50'
            }`}
          >
            <CheckCircle className={`w-4 h-4 ${actionType === 'approve' ? 'animate-bounce' : ''}`} />
            {t('workflow.action.approve')}
          </button>
          <button 
            onClick={() => setActionType('reject')} 
            className={`flex-1 py-3 rounded-xl border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              actionType === 'reject' 
              ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm' 
              : 'border-gray-100 text-gray-400 hover:border-gray-200 hover:bg-gray-50'
            }`}
          >
            <XCircle className={`w-4 h-4 ${actionType === 'reject' ? 'animate-shake' : ''}`} />
            {t('workflow.action.reject')}
          </button>
        </div>

        {/* 评论区 */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-1">
            {t('workflow.fields.comment')} 
            {actionType === 'reject' && <span className="text-rose-500 ml-1">*</span>}
          </label>
          <textarea 
            value={comment} 
            onChange={(e) => setComment(e.target.value)} 
            rows={3} 
            placeholder={actionType === 'reject' ? t('workflow.placeholder.reject_reason') : t('workflow.placeholder.approve_comment')} 
            className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-all text-sm font-medium resize-none shadow-inner"
          />
        </div>

        {/* 提交按钮 */}
        <button 
          onClick={handleSubmit} 
          disabled={!actionType || submitting} 
          className={`w-full py-3.5 rounded-xl text-white font-black text-sm transition-all shadow-md active:scale-95 ${
            actionType === 'reject' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' :
            actionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' :
            'bg-gray-200 cursor-not-allowed shadow-none'
          }`}
        >
          {submitting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t('common.processing')}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 uppercase tracking-widest">
              <Send className="w-4 h-4" />
              {actionType === 'approve' ? t('workflow.action.confirm_approve') : actionType === 'reject' ? t('workflow.action.confirm_reject') : t('workflow.action.select_action')}
            </div>
          )}
        </button>
      </div>
    </div>
  )
}
