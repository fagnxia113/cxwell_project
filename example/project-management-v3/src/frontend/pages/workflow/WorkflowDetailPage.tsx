import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  User, 
  UserPlus, 
  FileText, 
  History, 
  GitBranch 
} from 'lucide-react'

// Hooks
import { useWorkflowInstanceData } from '../../hooks/useWorkflowInstanceData'

// Components
import { WorkflowHeader } from '../../components/workflow/detail/WorkflowHeader'
import { BusinessFormSection } from '../../components/workflow/detail/BusinessFormSection'
import { ApprovalActionPanel } from '../../components/workflow/detail/ApprovalActionPanel'
import { WorkflowTabsContent } from '../../components/workflow/detail/WorkflowTabsContent'

const ICON_MAP: Record<string, any> = {
  'CheckCircle': <CheckCircle className="w-4 h-4" />,
  'XCircle': <XCircle className="w-4 h-4" />,
  'RotateCcw': <RotateCcw className="w-4 h-4" />,
  'User': <User className="w-4 h-4" />,
  'UserPlus': <UserPlus className="w-4 h-4" />
}

export default function WorkflowDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { 
    loading, instance, definition, tasks, logs, currentTask, currentUserId,
    formFields, activeFormData, masterData, transferOrder, repairOrder,
    loadInstanceData, getNodeActions, submitAction, handleWithdraw, confirm
  } = useWorkflowInstanceData()

  const [activeTab, setActiveTab] = useState<'form' | 'workflow' | 'history'>('form')
  const [actionType, setActionType] = useState<string>('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  // Action specific states
  const [targetNodeId, setTargetNodeId] = useState('')
  const [selectedSigners, setSelectedSigners] = useState<string[]>([])
  const [selectedTransferee, setSelectedTransferee] = useState<string>('')
  
  // Equipment specific states
  const [shippedAt, setShippedAt] = useState('')
  const [shippingNo, setShippingNo] = useState('')
  const [shippingAttachment, setShippingAttachment] = useState('')
  const [shippingItemImages, setShippingItemImages] = useState<Record<string, string[]>>({})
  const [shippingPackageImages, setShippingPackageImages] = useState<string[]>([])
  
  const [receivedAt, setReceivedAt] = useState('')
  const [receiveStatus, setReceiveStatus] = useState<'normal' | 'exception'>('normal')
  const [receiveComment, setReceiveComment] = useState('')
  const [receivingItemQuantities, setReceivingItemQuantities] = useState<Record<string, number>>({})
  const [receivingItemImages, setReceivingItemImages] = useState<Record<string, string[]>>({})
  const [receivingPackageImages, setReceivingPackageImages] = useState<string[]>([])

  useEffect(() => {
    if (instance) {
       // Auto-fill logic for equipment receiving
       if (receiveStatus === 'exception' && transferOrder?.items) {
         setReceivingItemQuantities(prev => {
           const next = { ...prev };
           transferOrder.items.forEach((item: any) => {
             const id = item.id || item.item_id || item.equipment_id;
             if (next[id] === undefined) next[id] = Number(item.quantity);
           });
           return next;
         });
       }
    }
  }, [receiveStatus, transferOrder, instance])

  const handleActionSubmit = async (type: string) => {
    if (submitting) return
    
    // Validation
    if (type === 'reject' || type === 'return') {
      if (!comment.trim()) return confirm({ title: t('common.warning'), content: t('workflow.error.inputRequired') })
    }
    
    if (!(await confirm({ title: t('common.confirm'), content: t(`workflow.confirm.${type}`) }))) return

    setSubmitting(true)
    
    let params: any = { comment }
    
    if (type === 'approve') {
       // Check for equipment logic
       const isEqTransfer = instance?.definition_key?.includes('equipment_transfer')
       if (isEqTransfer) {
         const isSource = currentTask?.node_id?.includes('from')
         const isTarget = currentTask?.node_id?.includes('to')
         
         if (isSource) {
           params.shipped_at = shippedAt
           params.shipping_no = shippingNo
           params.shipping_attachment = shippingAttachment
           params.shipping_item_images = shippingItemImages
           params.shipping_package_images = shippingPackageImages
         }
         
         if (isTarget) {
           params.received_at = receivedAt
           params.receive_status = receiveStatus
           params.receive_comment = receiveComment
           params.receiving_item_quantities = receivingItemQuantities
           params.receiving_item_images = receivingItemImages
           params.receiving_package_images = receivingPackageImages
         }
       }
    } else if (type === 'return') {
      params.targetNodeId = targetNodeId
    } else if (type === 'transfer') {
      params.targetUser = { id: selectedTransferee, name: masterData.users[selectedTransferee] }
    } else if (type === 'addSigner') {
      params.signers = selectedSigners.map(id => ({ id, name: masterData.users[id] }))
    }

    const success = await submitAction(type, params)
    if (success) {
      setActionType('')
      setComment('')
      // Reset other states...
    }
    setSubmitting(true) // Reset UI state later via effect if needed, but here simple
    setSubmitting(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-blue-200 rounded-full" />
        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin" />
      </div>
    </div>
  )

  if (!instance) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-700">{t('workflow.not_found')}</h1>
        <button onClick={() => navigate(-1)} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
          {t('common.back')}
        </button>
      </div>
    </div>
  )

  const nodeActions = getNodeActions().map((a: any) => ({ ...a, icon: ICON_MAP[a.icon] }))

  return (
    <div className="min-h-screen bg-mesh pb-12">
      <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-4">
        {/* 1. Header & Summary */}
        <WorkflowHeader
          instance={instance}
          currentTask={currentTask}
          currentUserId={currentUserId}
          t={t}
          onActionClick={setActionType}
          onWithdraw={handleWithdraw}
          nodeActions={nodeActions}
        />

        {/* 2. Approval Control Panel (Appears when action selected) */}
        <ApprovalActionPanel
          actionType={actionType}
          setActionType={setActionType}
          comment={comment}
          setComment={setComment}
          submitting={submitting}
          onSubmit={handleActionSubmit}
          targetNodeId={targetNodeId}
          setTargetNodeId={setTargetNodeId}
          definition={definition}
          currentTask={currentTask}
          selectedSigners={selectedSigners}
          setSelectedSigners={setSelectedSigners}
          selectedTransferee={selectedTransferee}
          setSelectedTransferee={setSelectedTransferee}
          userMap={masterData.users}
          currentUserId={currentUserId}
          instance={instance}
          shippingState={{ shippedAt, setShippedAt, shippingNo, setShippingNo, shippingAttachment, setShippingAttachment, shippingItemImages, setShippingItemImages, shippingPackageImages, setShippingPackageImages, items: transferOrder?.items || [] }}
          receivingState={{ receivedAt, setReceivedAt, receiveStatus, setReceiveStatus, receiveComment, setReceiveComment, receivingItemQuantities, setReceivingItemQuantities, receivingItemImages, setReceivingItemImages, receivingPackageImages, setReceivingPackageImages }}
          transferOrder={transferOrder}
          t={t}
        />

        {/* 3. Main Content Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-100 bg-gray-50/50">
            {[ 
              { id: 'form', icon: <FileText className="w-4 h-4" />, label: t('workflow.application_content') },
              { id: 'workflow', icon: <GitBranch className="w-4 h-4" />, label: t('workflow.process_status') },
              { id: 'history', icon: <History className="w-4 h-4" />, label: t('workflow.history') }
            ].map((tab: any) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all relative ${
                  activeTab === tab.id ? 'text-blue-600 bg-white' : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full" />}
              </button>
            ))}
          </div>

          <div className="p-6">
            <WorkflowTabsContent
              activeTab={activeTab}
              instance={instance}
              tasks={tasks}
              logs={logs}
              definition={definition}
              t={t}
              renderFormTab={() => (
                <BusinessFormSection
                  instance={instance}
                  currentTask={currentTask}
                  activeFormData={activeFormData}
                  formFields={formFields}
                  masterData={masterData}
                  transferOrder={transferOrder}
                  repairOrder={repairOrder}
                  t={t}
                />
              )}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
