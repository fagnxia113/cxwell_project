import React from 'react'
import { CheckCircle, XCircle, RotateCcw, UserPlus, User, Save, ClipboardCopy } from 'lucide-react'
import { EquipmentShippingForm } from './actions/EquipmentShippingForm'
import { EquipmentReceivingForm } from './actions/EquipmentReceivingForm'
import { WorkflowInstance, WorkflowTask, WorkflowLog } from '../../../types/workflow-instance'

interface ApprovalActionPanelProps {
  actionType: string
  setActionType: (val: string) => void
  comment: string
  setComment: (val: string) => void
  submitting: boolean
  onSubmit: (action: string) => void
  // Rollback
  targetNodeId: string
  setTargetNodeId: (val: string) => void
  definition: any
  currentTask: WorkflowTask | null
  logs: WorkflowLog[]
  // Signer / Transfer
  selectedSigners: string[]
  setSelectedSigners: (val: string[]) => void
  selectedTransferee: string
  setSelectedTransferee: (val: string) => void
  userMap: Record<string, string>
  currentUserId: string
  // Equipment State
  instance: WorkflowInstance | null
  shippingState?: any
  receivingState?: any
  transferOrder?: any
  t: any
}

export const ApprovalActionPanel: React.FC<ApprovalActionPanelProps> = ({
  actionType, setActionType,
  comment, setComment,
  submitting, onSubmit,
  targetNodeId, setTargetNodeId,
  definition, currentTask,
  logs,
  selectedSigners, setSelectedSigners,
  selectedTransferee, setSelectedTransferee,
  userMap, currentUserId,
  instance,
  shippingState, receivingState,
  transferOrder,
  t
}) => {
  if (!actionType) return null

  const isEquipmentTransfer = instance?.definition_key?.includes('equipment_transfer') || instance?.definition_key?.includes('equipment-transfer')
  const isSourceNode = currentTask?.node_id === 'from-location-manager' || currentTask?.node_id?.includes('from')
  const isTargetNode = currentTask?.node_id === 'to-location-manager' || currentTask?.node_id?.includes('to')

  const actionIcon = () => {
    switch (actionType) {
      case 'addSigner': return <UserPlus className="w-6 h-6 text-teal-600" />
      case 'transfer': return <User className="w-6 h-6 text-purple-600" />
      case 'approve': return <CheckCircle className="w-6 h-6 text-emerald-600" />
      case 'reject': return <XCircle className="w-6 h-6 text-rose-600" />
      case 'cc': return <ClipboardCopy className="w-6 h-6 text-indigo-600" />
      case 'return': return <RotateCcw className="w-6 h-6 text-amber-600" />
      default: return <Save className="w-6 h-6 text-blue-600" />
    }
  }

  const actionTitle = () => {
    switch (actionType) {
      case 'addSigner': return t('workflow.action.addSigner') || '加签人员'
      case 'transfer': return t('workflow.action.transfer') || '任务移交'
      case 'return': return t('workflow.action.return') || '退回节点'
      case 'approve': return t('workflow.action.approve') || '内容审批'
      case 'reject': return t('workflow.action.reject') || '拒绝申请'
      case 'cc': return t('workflow.action.cc') || '抄送人员'
      default: return t('workflow.result') || '处理申请'
    }
  }

  return (
    <div className="mb-4 bg-white rounded-xl shadow-sm border border-slate-100 p-4 animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
            {actionIcon()}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              {actionTitle()}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              {t('workflow.action_required')}
            </p>
          </div>
        </div>
        <button
          onClick={() => setActionType('')}
          className="w-7 h-7 rounded-lg border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Action Specific UI */}
      <div className="space-y-3">
        {actionType === 'return' && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600 ml-0.5">
              {t('workflow.target_node')} <span className="text-rose-500">*</span>
            </label>
            <select
              value={targetNodeId}
              onChange={(e) => setTargetNodeId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-sm"
            >
              <option value="">{t('common.select')}</option>
              {logs
                .filter((log: any) => log.action === 'approved' || log.action === 'rollback')
                .filter((log: any, idx: number, arr: any[]) => arr.findIndex((l: any) => l.node_id === log.node_id) === idx)
                .filter((log: any) => log.node_id !== currentTask?.node_id)
                .map((log: any) => (
                  <option key={log.node_id} value={log.node_id}>
                    {log.node_name}
                  </option>
                ))}
            </select>
          </div>
        )}

        {(actionType === 'addSigner' || actionType === 'cc') && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600 ml-0.5">
              {actionType === 'cc' ? (t('workflow.action.cc_select') || '选择抄送人') : t('workflow.assignee')} <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-1.5 max-h-40 overflow-y-auto border border-slate-100 rounded-lg p-2 bg-slate-50/50">
              {Object.entries(userMap).map(([id, name]) => (
                <label
                  key={id}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all border text-xs ${
                    selectedSigners.includes(id)
                      ? actionType === 'cc' ? 'bg-indigo-50 border-indigo-200' : 'bg-teal-50 border-teal-200'
                      : 'bg-white/50 border-transparent hover:border-slate-200 hover:bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSigners.includes(id)}
                    onChange={(e) => e.target.checked ? setSelectedSigners([...selectedSigners, id]) : setSelectedSigners(selectedSigners.filter(x => x !== id))}
                    className={`rounded focus:ring-offset-1 h-4 w-4 ${actionType === 'cc' ? 'text-indigo-600 focus:ring-indigo-500' : 'text-teal-600 focus:ring-teal-500'}`}
                  />
                  <span className={`font-medium ${selectedSigners.includes(id) ? actionType === 'cc' ? 'text-indigo-900' : 'text-teal-900' : 'text-slate-600'}`}>
                    {name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {actionType === 'transfer' && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600 ml-0.5">
              {t('workflow.assignee')} <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedTransferee}
              onChange={(e) => setSelectedTransferee(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg focus:ring-2 focus:ring-purple-100 focus:bg-white transition-all text-sm"
            >
              <option value="">{t('common.select')}</option>
              {Object.entries(userMap)
                .filter(([id]) => id !== currentUserId)
                .map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
            </select>
          </div>
        )}

        {/* Specialized Business Forms */}
        {actionType === 'approve' && isEquipmentTransfer && isSourceNode && (
          <EquipmentShippingForm {...shippingState} t={t} />
        )}

        {actionType === 'approve' && isEquipmentTransfer && isTargetNode && (
          <EquipmentReceivingForm {...receivingState} transferOrder={transferOrder} t={t} />
        )}

        {/* Generic Comment Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-600 ml-0.5">
            {t('workflow.comment')} {(actionType === 'reject' || actionType === 'return') && <span className="text-rose-500">*</span>}
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('workflow.placeholder.comment')}
            rows={2}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-sm resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={() => setActionType('')}
            className="px-4 py-1.5 text-slate-500 bg-slate-50 rounded-lg hover:bg-slate-100 transition-all text-xs font-medium"
          >
            {t('common.cancel')}
          </button>
          <button
            disabled={submitting}
            onClick={() => onSubmit(actionType)}
            className={`px-5 py-1.5 text-white rounded-lg transition-all text-xs font-semibold active:scale-95 disabled:opacity-50 flex items-center gap-1.5 ${
              actionType === 'reject' ? 'bg-rose-500 hover:bg-rose-600' :
              actionType === 'return' ? 'bg-amber-500 hover:bg-amber-600' :
              actionType === 'transfer' ? 'bg-purple-500 hover:bg-purple-600' :
              actionType === 'addSigner' ? 'bg-teal-500 hover:bg-teal-600' :
              actionType === 'cc' ? 'bg-indigo-500 hover:bg-indigo-600' :
              'bg-emerald-500 hover:bg-emerald-600'
            }`}
          >
            {submitting ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                {t('common.confirm')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
