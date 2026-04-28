import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  FileText,
  Clock,
  History,
  GitBranch,
  Eye,
  CheckCircle,
  XCircle,
  RotateCcw,
  Share2,
  UserPlus,
  ClipboardCopy
} from 'lucide-react'

import { useWorkflowInstanceData } from '../../hooks/useWorkflowInstanceData'
import { getStatusConfig } from '../../types/workflow-instance'
import FormTemplateRenderer from '../../components/workflow/FormTemplateRenderer'
import ApprovalFormPayloadView from '../../components/approvals/ApprovalFormPayloadView'
import { usePermission } from '../../contexts/PermissionContext'

// Modular Components
import { WorkflowHeader } from '../../components/workflow/detail/WorkflowHeader'
import { ApprovalActionPanel } from '../../components/workflow/detail/ApprovalActionPanel'
import { WorkflowTabsContent } from '../../components/workflow/detail/WorkflowTabsContent'
import { getFlowName } from '../../constants/workflowConstants'

export default function WorkflowDetailPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { hasButton } = usePermission()
  const {
    loading, instance, definition, tasks, logs, currentTask, currentUserId,
    formFields, activeFormData, setActiveFormData, masterData, transferOrder,
    submitAction, handleWithdraw, confirm,
    warning
  } = useWorkflowInstanceData()

  const [activeTab, setActiveTab] = useState<'form' | 'workflow' | 'history'>('form')
  const [actionType, setActionType] = useState<string>('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [targetNodeId, setTargetNodeId] = useState('')
  const [selectedSigners, setSelectedSigners] = useState<string[]>([])
  const [selectedTransferee, setSelectedTransferee] = useState<string>('')

  // Equipment Specific State
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
    if (instance && receiveStatus === 'exception' && transferOrder?.items) {
      setReceivingItemQuantities(prev => {
        const next = { ...prev };
        transferOrder.items.forEach((item: any) => {
          const id = item.id || item.item_id || item.equipment_id;
          if (next[id] === undefined) next[id] = Number(item.quantity);
        });
        return next;
      });
    }
  }, [receiveStatus, transferOrder, instance])

  const handleActionSubmit = async (type: string) => {
    if (submitting) return

    if ((type === 'reject' || type === 'return') && !comment.trim()) {
      warning(t('workflow.error.inputRequired'))
      return
    }

    if (!(await confirm({ title: t('common.confirm'), content: t(`workflow.confirm.${type}`) || t('common.confirm') }))) return

    setSubmitting(true)
    let params: any = { comment }

    if (type === 'approve') {
      params.variables = { formData: activeFormData }
      const isEqTransfer = instance?.definition_key?.includes('equipment_transfer')
      if (isEqTransfer) {
        const isSource = currentTask?.node_id?.includes('from')
        const isTarget = currentTask?.node_id?.includes('to')
        if (isSource) {
          params.shipped_at = shippedAt; params.shipping_no = shippingNo
          params.shipping_attachment = shippingAttachment; params.shipping_item_images = shippingItemImages
          params.shipping_package_images = shippingPackageImages
        }
        if (isTarget) {
          params.received_at = receivedAt; params.receive_status = receiveStatus
          params.receive_comment = receiveComment; params.receiving_item_quantities = receivingItemQuantities
          params.receiving_item_images = receivingItemImages; params.receiving_package_images = receivingPackageImages
        }
      }
    } else if (type === 'return') {
      params.targetNodeId = targetNodeId
    } else if (type === 'transfer') {
      params.targetUser = { id: selectedTransferee, name: masterData.users[selectedTransferee] }
    } else if (type === 'addSigner' || type === 'cc') {
      params.signers = selectedSigners.map(id => ({ id, name: masterData.users[id] }))
    }

    const result = await submitAction(type, params)
    if (result) {
      setActionType(''); setComment('');
    }
    setSubmitting(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 border-8 border-slate-200 rounded-full" />
        <div className="absolute inset-0 border-8 border-blue-600 rounded-full border-t-transparent animate-spin" />
      </div>
    </div>
  )

  if (!instance) return (
    <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-6">
      <div className="text-center p-12 bg-white rounded-3xl shadow-2xl max-w-md w-full animate-in zoom-in duration-500">
        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-12 transition-transform hover:rotate-0 duration-500">
          <XCircle className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-slate-800 mb-2">{t('workflow.not_found')}</h1>
        <p className="text-slate-500 mb-8 font-medium">The workflow instance you are looking for does not exist or has been deleted.</p>
        <button onClick={() => navigate(-1)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95">
          {t('common.back')}
        </button>
      </div>
    </div>
  )

  const formatLocalDateTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString(i18n.language, {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    })
  }

  // Enrich data with real names from masterData
  const enrichedInstance = instance ? {
    ...instance,
    initiator_name: masterData.users[instance.initiator_id] || masterData.users[instance.initiator_name] || instance.initiator_name
  } : null

  const enrichedLogs = logs.map(log => ({
    ...log,
    operator_name: masterData.users[log.operator_id || ''] || masterData.users[log.operator_name || ''] || log.operator_name
  }))

  const enrichedTasks = tasks.map(task => ({
    ...task,
    assignee_name: masterData.users[task.assignee_id || ''] || masterData.users[task.assignee_name || ''] || task.assignee_name
  }))

  const enrichedCurrentTask = enrichedTasks.find(t => 
    t.assignees?.includes(currentUserId) || 
    t.assignee_id === currentUserId
  ) || (enrichedTasks.length > 0 ? enrichedTasks[0] : null)

  const isAssignee = !!enrichedCurrentTask && (
    enrichedCurrentTask.assignees?.includes(currentUserId) || 
    enrichedCurrentTask.assignee_id === currentUserId
  )

  const documentNo = activeFormData?._documentNo || (enrichedInstance?.business_id) || (enrichedInstance?.id?.substring(0, 8).toUpperCase()) || '-'
  const applyDate = activeFormData?._applyDate ? formatLocalDateTime(activeFormData._applyDate) : formatLocalDateTime(enrichedInstance?.start_time)
  const applicantName = activeFormData?._applicant ? (masterData.users[activeFormData._applicant] || activeFormData._applicant) : (enrichedInstance?.initiator_name || '-')
  const processTitle = activeFormData?._title || activeFormData?.title || enrichedInstance?.title || getFlowName(enrichedInstance?.definition_key || definition?.flowCode || '', definition?.flowName || '')

  const primaryActions = [
    { type: 'approve', label: t('workflow.action.approve'), icon: <CheckCircle className="w-4 h-4" />, className: 'bg-emerald-600 shadow-emerald-200', perm: 'workflow:approve' },
    { type: 'reject', label: t('workflow.action.reject'), icon: <XCircle className="w-4 h-4" />, className: 'bg-rose-600 shadow-rose-200', perm: 'workflow:reject' },
    { type: 'return', label: t('workflow.action.return') || '退回', icon: <RotateCcw className="w-4 h-4" />, className: 'bg-amber-600 shadow-amber-200', perm: 'workflow:return' },
    { type: 'transfer', label: t('workflow.action.transfer') || '移交', icon: <Share2 className="w-4 h-4" />, className: 'bg-purple-600 shadow-purple-200', perm: 'workflow:transfer' },
    { type: 'addSigner', label: t('workflow.action.addSigner') || '加签', icon: <UserPlus className="w-4 h-4" />, className: 'bg-teal-600 shadow-teal-200', perm: 'workflow:transfer' },
    { type: 'cc', label: t('workflow.action.cc') || '抄送', icon: <ClipboardCopy className="w-4 h-4" />, className: 'bg-indigo-600 shadow-indigo-200', perm: 'workflow:cc' },
  ]

  const enabledActions = primaryActions.filter(a => isAssignee || hasButton(a.perm))

  const isBookerExecute = enrichedInstance?.definition_key === 'flight_booking' && (enrichedCurrentTask?.node_id === 'BOOKER_EXECUTE' || enrichedCurrentTask?.name === '预定员处理')
  const editableFields = isBookerExecute ? ['final_amount', 'ticket_photo'] : []

  const renderFormTab = () => (
    <div className="bg-white/80 rounded-xl shadow-sm border border-white overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <div className="p-1.5 bg-emerald-100 rounded-md">
            <Eye className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          {t('workflow.application_content')}
        </h3>
        {currentTask && (
          <span className="text-[10px] font-medium px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md border border-blue-100">
            {currentTask.name || currentTask.node_name}
          </span>
        )}
      </div>

      <div className="p-4">
        {formFields.length > 0 ? (
          <FormTemplateRenderer
            fields={formFields}
            data={activeFormData}
            onFieldChange={(name, value) => setActiveFormData((prev: any) => ({ ...prev, [name]: value }))}
            mode="view"
            editableFields={editableFields}
          />
        ) : activeFormData && Object.keys(activeFormData).length > 0 ? (
          <ApprovalFormPayloadView formData={activeFormData} orderType={instance.definition_key || ''} />
        ) : (
          <div className="text-center py-12 text-slate-300">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-10" />
            <p className="font-medium text-xs italic">{t('workflow.no_definition')}</p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <div className="max-w-6xl mx-auto p-4 lg:p-6 space-y-4">
        
        {/* Header Section */}
        {enrichedInstance && (
          <WorkflowHeader
            instance={enrichedInstance}
            processTitle={processTitle}
            currentTask={enrichedCurrentTask}
            currentUserId={currentUserId}
            t={t}
            onActionClick={(type) => setActionType(type === actionType ? '' : type)}
            onWithdraw={handleWithdraw}
            nodeActions={enabledActions}
            documentNo={documentNo}
            applyDate={applyDate}
            applicantName={applicantName}
            activeActionType={actionType}
          />
        )}

        {/* Approval Action Panel */}
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
          currentTask={enrichedCurrentTask}
          logs={enrichedLogs}
          selectedSigners={selectedSigners}
          setSelectedSigners={setSelectedSigners}
          selectedTransferee={selectedTransferee}
          setSelectedTransferee={setSelectedTransferee}
          userMap={masterData.users}
          currentUserId={currentUserId}
          instance={enrichedInstance}
          shippingState={{
            shippedAt, setShippedAt, shippingNo, setShippingNo,
            shippingAttachment, setShippingAttachment, shippingItemImages, setShippingItemImages,
            shippingPackageImages, setShippingPackageImages
          }}
          receivingState={{
            receivedAt, setReceivedAt, receiveStatus, setReceiveStatus,
            receiveComment, setReceiveComment, receivingItemQuantities, setReceivingItemQuantities,
            receivingItemImages, setReceivingItemImages, receivingPackageImages, setReceivingPackageImages
          }}
          transferOrder={transferOrder}
          t={t}
        />

        {/* Main Content: Tabs */}
        <div className="space-y-4">
          {/* Tab Headers */}
          <div className="flex items-center gap-1 bg-white/70 backdrop-blur-sm p-1 rounded-lg w-fit border border-white shadow-sm">
            {[
              { id: 'form', label: t('workflow.basic_info') || '表单内容', icon: <FileText className="w-4 h-4" /> },
              { id: 'workflow', label: t('workflow.process_status') || '流程进度', icon: <GitBranch className="w-4 h-4" /> },
              { id: 'history', label: t('workflow.action_logs.title') || '审批历史', icon: <History className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div>
            <WorkflowTabsContent 
              activeTab={activeTab}
              instance={enrichedInstance}
              tasks={enrichedTasks}
              logs={enrichedLogs}
              definition={definition}
              t={t}
              renderFormTab={renderFormTab}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
