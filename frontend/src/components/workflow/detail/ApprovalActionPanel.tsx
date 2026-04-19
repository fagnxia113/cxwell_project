import React from 'react'
import { CheckCircle, XCircle, RotateCcw, UserPlus, User, Save } from 'lucide-react'
import { EquipmentShippingForm } from './actions/EquipmentShippingForm'
import { EquipmentReceivingForm } from './actions/EquipmentReceivingForm'
import { WorkflowInstance, WorkflowTask } from '../../../types/workflow-instance'

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
  // Signer / Transfer
  selectedSigners: string[]
  setSelectedSigners: (val: string[]) => void
  selectedTransferee: string
  setSelectedTransferee: (val: string) => void
  userMap: Record<string, string>
  currentUserId: string
  // Equipment State
  instance: WorkflowInstance | null
  shippingState: any
  receivingState: any
  transferOrder: any
  t: any
}

export const ApprovalActionPanel: React.FC<ApprovalActionPanelProps> = ({
  actionType, setActionType,
  comment, setComment,
  submitting, onSubmit,
  targetNodeId, setTargetNodeId,
  definition, currentTask,
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

  return (
    <div className="mb-6 bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-in slide-in-from-top duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          {actionType === 'addSigner' ? <UserPlus className="w-6 h-6 text-teal-600" /> :
           actionType === 'transfer' ? <User className="w-6 h-6 text-purple-600" /> :
           actionType === 'approve' ? <CheckCircle className="w-6 h-6 text-emerald-600" /> :
           actionType === 'reject' ? <XCircle className="w-6 h-6 text-rose-600" /> :
           <RotateCcw className="w-6 h-6 text-amber-600" />}
          {actionType === 'addSigner' ? t('workflow.action.addSigner') :
           actionType === 'transfer' ? t('workflow.action.transfer') :
           actionType === 'return' ? t('workflow.action.return') :
           t('workflow.result')}
        </h3>
        <button 
          onClick={() => setActionType('')}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Action Specific UI */}
      <div className="space-y-6">
        {actionType === 'return' && (
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              {t('workflow.target_node')} <span className="text-rose-500">*</span>
            </label>
            <select
              value={targetNodeId}
              onChange={(e) => setTargetNodeId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('common.select')}</option>
              {definition?.node_config?.nodes
                ?.filter((node: any) => node.type === 'userTask' && node.id !== currentTask?.node_id)
                ?.map((node: any) => (
                  <option key={node.id} value={node.id}>
                    {node.name}
                  </option>
                ))}
            </select>
          </div>
        )}

        {actionType === 'addSigner' && (
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              {t('workflow.assignee')} <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto border border-gray-100 rounded-xl p-4 bg-gray-50/50">
              {Object.entries(userMap).map(([id, name]) => (
                <label key={id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${selectedSigners.includes(id) ? 'bg-teal-50 border border-teal-200' : 'hover:bg-white border border-transparent'}`}>
                  <input
                    type="checkbox"
                    checked={selectedSigners.includes(id)}
                    onChange={(e) => e.target.checked ? setSelectedSigners([...selectedSigners, id]) : setSelectedSigners(selectedSigners.filter(x => x !== id))}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span className={`text-sm ${selectedSigners.includes(id) ? 'text-teal-900 font-medium' : 'text-gray-600'}`}>{name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {actionType === 'transfer' && (
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              {t('workflow.assignee')} <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedTransferee}
              onChange={(e) => setSelectedTransferee(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
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
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            {t('workflow.comment')} {(actionType === 'reject' || actionType === 'return') && <span className="text-rose-500">*</span>}
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t('workflow.placeholder.comment')}
            rows={3}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-inner"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={() => setActionType('')}
            className="px-6 py-2.5 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            {t('common.cancel')}
          </button>
          <button
            disabled={submitting}
            onClick={() => onSubmit(actionType)}
            className={`px-8 py-2.5 text-white rounded-lg transition-all font-bold shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2 ${
              actionType === 'reject' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' :
              actionType === 'return' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200' :
              actionType === 'transfer' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-200' :
              actionType === 'addSigner' ? 'bg-teal-600 hover:bg-teal-700 shadow-teal-200' :
              'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
            }`}
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                {t('common.confirm')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
