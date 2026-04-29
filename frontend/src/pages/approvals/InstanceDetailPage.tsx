import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  GitBranch,
  Send,
  FileX,
  MessageSquare
} from 'lucide-react'
import { workflowApi } from '../../api/workflowApi'
import { formApi } from '../../api/formApi'
import { useMessage } from '../../hooks/useMessage'
import { useConfirm } from '../../hooks/useConfirm'
import { useTranslation } from 'react-i18next'
import { parseJWTToken } from '../../config/api'
import { cn } from '../../utils/cn'
import FlowDetailView from '../../components/workflow/FlowDetailView'
import { useFetch } from '../../hooks/useReactQuery'

export default function InstanceDetailPage() {
  const { instanceId } = useParams<{ instanceId: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const message = useMessage()
  const { confirm } = useConfirm()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [instance, setInstance] = useState<any>(null)
  const [currentTasks, setCurrentTasks] = useState<any[]>([])
  const [timeline, setTimeline] = useState<any[]>([])
  const [formTemplate, setFormTemplate] = useState<any>(null)
  const [formData, setFormData] = useState<any>({})
  const [opinion, setOpinion] = useState('')
  const [actionType, setActionType] = useState<'pass' | 'reject'>('pass')
  const [historyNodes, setHistoryNodes] = useState<any[]>([])
  const [targetNodeCode, setTargetNodeCode] = useState<string>('')
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [userMap, setUserMap] = useState<Record<string, string>>({})

  const { data: employeesData } = useFetch(['employees'], '/api/personnel/employees?pageSize=1000')

  useEffect(() => {
    if (employeesData?.data) {
      const uMap: Record<string, string> = {}
      employeesData.data.forEach((u: any) => {
        if (u.name) {
          if (u.userId) uMap[u.userId] = u.name
          if (u.user_id) uMap[u.user_id] = u.name
          if (u.employeeId) uMap[u.employeeId] = u.name
          if (u.employee_id) uMap[u.employee_id] = u.name
          if (u.loginName) uMap[u.loginName] = u.name
          if (u.login_name) uMap[u.login_name] = u.name
          if (u.id) uMap[u.id] = u.name
        }
      })
      setUserMap(uMap)
    }
  }, [employeesData])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      const decoded = parseJWTToken(token)
      if (decoded?.loginName) setCurrentUserId(decoded.loginName)
    }
    if (instanceId) loadData()
  }, [instanceId])

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await workflowApi.getTimeline(instanceId!)
      if (!res.success || !res.data) {
        message.error(t('approvals.error.not_found', 'Process instance not found'))
        return navigate(-1)
      }

      const data = res.data
      const instanceData = data.instance
      const timelineData = data.timeline || []
      const tasksData = data.currentTasks || []

      let loadedFormData = instanceData?.form_data || {}
      if (typeof loadedFormData === 'string') {
        try { loadedFormData = JSON.parse(loadedFormData) } catch { loadedFormData = {} }
      }

      setInstance(instanceData)
      setCurrentTasks(tasksData)
      setTimeline(timelineData)
      setFormData(loadedFormData)

      if (instanceData?.process_type) {
        const templateRes = await formApi.getTemplate(instanceData.process_type)
        setFormTemplate(templateRes.data)
      }

      const historyRes = await workflowApi.getHistory(instanceId!)
      setHistoryNodes(historyRes.data || [])

    } catch (error: any) {
      console.error(error)
      message.error(t('approvals.error.load_failed', 'Failed to load process details'))
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: 'pass' | 'reject') => {
    if (!currentTasks || currentTasks.length === 0) {
      message.error(t('approvals.error.no_tasks', 'No tasks to handle'))
      return
    }

    const task = currentTasks[0]
    const isConfirmed = await confirm({
      title: action === 'pass' ? t('approvals.action.confirm_pass', 'Confirm Approve') : t('approvals.action.confirm_reject', 'Confirm Reject'),
      content: t('approvals.message.confirm_content', { node: task.node_name || task.nodeName }),
      type: action === 'pass' ? 'primary' : 'danger'
    })

    if (!isConfirmed) return

    try {
      setSubmitting(true)
      await workflowApi.submitTask(task.id.toString(), action, { formData }, opinion, targetNodeCode)
      message.success(action === 'pass' ? t('approvals.message.pass_success') : t('approvals.message.reject_success'))
      navigate('/approvals/pending')
    } catch (err: any) {
      message.error(err.message || t('common.error.operation_failed', 'Operation failed'))
    } finally {
      setSubmitting(false)
    }
  }

  const isCurrentAssignee = currentTasks.some((t: any) => {
    if (t.assignees && Array.isArray(t.assignees)) {
      return t.assignees.includes(currentUserId)
    }
    const assigneeId = t.assignee_id || t.approver || ''
    return assigneeId === currentUserId || t.assignee_name === currentUserId
  })

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
      <p className="text-xs font-black uppercase tracking-widest text-slate-400">{t('approvals.loading_task')}</p>
    </div>
  )

  if (!instance) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <p className="text-sm font-black uppercase tracking-widest text-slate-400">{t('approvals.error.not_found')}</p>
      <button
        onClick={() => navigate(-1)}
        className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
      >
        {t('common.back')}
      </button>
    </div>
  )

  const currentNodeName = instance?.current_node_name || instance?.nodeName || ''
  const currentTask = currentTasks[0]

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="flex items-center justify-end gap-3">
        {currentNodeName && (
          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
            {t('approvals.current_node')}: {currentNodeName}
          </span>
        )}
        {instance?.status && (
          <span className={cn(
            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
            instance.status === 'running' && 'bg-amber-50 text-amber-600 border-amber-100',
            (instance.status === 'completed' || instance.status === 'finished') && 'bg-emerald-50 text-emerald-600 border-emerald-100',
            (instance.status === 'terminated' || instance.status === 'rejected') && 'bg-rose-50 text-rose-600 border-rose-100'
          )}>
            {instance.status === 'running' ? t('approvals.status.running') : (instance.status === 'completed' || instance.status === 'finished') ? t('approvals.status.finished') : t('approvals.status.terminated')}
          </span>
        )}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold transition-all p-2"
        >
          <ArrowLeft size={20} />
          {t('approvals.back_to_list')}
        </button>
      </div>

      <FlowDetailView
        title={instance?.title || instance?.process_title || t('approvals.history.title')}
        processTitle={instance?.title || instance?.process_title}
        initiatorName={userMap[instance?.initiator_id] || userMap[instance?.initiator_name] || instance?.initiator_name}
        createdAt={instance?.start_time || instance?.create_time}
        nodeName={currentNodeName}
        orderType={instance?.process_type || instance?.definition_key}
        handlerName={userMap[instance?.current_assignee_id] || userMap[instance?.current_assignee_name] || currentTask?.assignee_name || currentTask?.approver}
        formTemplate={formTemplate}
        formData={formData}
        readOnly={true}
        timeline={timeline.map(item => ({
          ...item,
          approver: userMap[item.operator_id] || userMap[item.approver] || item.approver
        }))}
        showTimeline={true}
        currentNodeName={currentNodeName}
        editableFields={['amount', 'attachment']}
        onFormDataChange={(name, value) => setFormData((prev: any) => ({ ...prev, [name]: value }))}
      >
        {isCurrentAssignee && instance?.status === 'running' && (
          <div className="bg-slate-900 rounded-xl p-6 text-white shadow-lg mt-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="text-indigo-400" size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wide">{t('workflow.action.approval_panel', 'Decision Opinion')}</h3>
            </div>
            <textarea
              value={opinion}
              onChange={(e) => setOpinion(e.target.value)}
              placeholder={t('workflow.placeholder.approve_comment', 'Enter your approval or rejection comments...')}
              className="w-full bg-slate-800 border-none rounded-lg p-4 text-sm min-h-[100px] focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all placeholder:text-slate-500 resize-none"
            />
            <div className="flex gap-3 mt-4 pt-4 border-t border-slate-700">
              <div className="flex-1 space-y-3">
                {actionType === 'reject' && historyNodes.length > 0 && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">{t('workflow.return_target', 'Return Target')}</label>
                    <select
                      value={targetNodeCode}
                      onChange={(e) => setTargetNodeCode(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-xs font-medium text-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                    >
                      <option value="">{t('workflow.default_previous', 'Default (Previous Step)')}</option>
                      {historyNodes.map((node: any) => (
                        <option key={node.nodeCode} value={node.nodeCode}>
                          {node.nodeName} [{t('workflow.done_by', 'Done')}: {node.approver}]
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    disabled={submitting}
                    onClick={() => {
                      setActionType('pass')
                      handleAction('pass')
                    }}
                    className={cn(
                      "flex-1 py-3 rounded-lg font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
                      actionType === 'pass' ? "bg-emerald-500 text-white" : "bg-slate-700 text-slate-400"
                    )}
                  >
                    <Send size={14} />
                    {t('workflow.action.approve', 'Approve')}
                  </button>
                  <button
                    disabled={submitting}
                    onClick={() => {
                      if (actionType !== 'reject') {
                        setActionType('reject')
                        message.info(t('workflow.select_reject_target', 'Please select reject target and confirm'))
                      } else {
                        handleAction('reject')
                      }
                    }}
                    className={cn(
                      "flex-1 py-3 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
                      actionType === 'reject' ? "bg-rose-500 text-white" : "bg-slate-700 text-slate-400"
                    )}
                  >
                    <FileX size={14} />
                    {t('workflow.action.reject', 'Reject')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </FlowDetailView>

      <div className="flex justify-center">
        <button
          onClick={() => navigate(`/workflow/visualization/${instanceId}`)}
          className="px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl hover:bg-slate-50 transition-all font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-sm"
        >
          <GitBranch size={16} className="text-indigo-600" />
          {t('approvals.action.view_flow')}
        </button>
      </div>
    </div>
  )
}
