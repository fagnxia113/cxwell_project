import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { apiClient } from '../utils/apiClient'
import { parseJWTToken } from '../config/api'
import { useFetch } from './useReactQuery'
import { useMessage } from './useMessage'
import { useConfirm } from './useConfirm'
import { WorkflowInstance, WorkflowTask, WorkflowLog } from '../types/workflow-instance'

export function useWorkflowInstanceData() {
  const { t } = useTranslation()
  const { instanceId: pInstanceId, taskId } = useParams<{ instanceId: string; taskId: string }>()
  const [instanceId, setInstanceId] = useState<string | undefined>(pInstanceId)
  const navigate = useNavigate()
  const { success, error, warning } = useMessage()
  const { confirm } = useConfirm()

  useEffect(() => {
    if (pInstanceId) setInstanceId(pInstanceId)
  }, [pInstanceId])

  const [loading, setLoading] = useState(true)
  const [instance, setInstance] = useState<WorkflowInstance | null>(null)
  const [definition, setDefinition] = useState<any>(null)
  const [tasks, setTasks] = useState<WorkflowTask[]>([])
  const [logs, setLogs] = useState<WorkflowLog[]>([])
  const [currentTask, setCurrentTask] = useState<WorkflowTask | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [formFields, setFormFields] = useState<any[]>([])
  const [activeFormData, setActiveFormData] = useState<any>({})

  const [masterData, setMasterData] = useState({
    depts: {} as Record<string, string>,
    positions: {} as Record<string, string>,
    warehouses: {} as Record<string, string>,
    projects: {} as Record<string, string>,
    users: {} as Record<string, string>,
    customers: {} as Record<string, string>
  })

  const [transferOrder, setTransferOrder] = useState<any>(null)
  const [repairOrder, setRepairOrder] = useState<any>(null)

  const { data: employeesData } = useFetch(['employees'], '/api/personnel/employees?pageSize=1000')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      const decoded = parseJWTToken(token)
      if (decoded?.loginName) setCurrentUserId(decoded.loginName)
    }
  }, [])

  useEffect(() => {
    if (employeesData?.data) {
      const uMap: Record<string, string> = {}
      employeesData.data.forEach((u: any) => {
        if (u.user_id) uMap[u.user_id] = u.name
        uMap[u.loginName || u.id] = u.name
      })
      setMasterData(prev => ({ ...prev, users: uMap }))
    }
  }, [employeesData])

  const loadInstanceData = useCallback(async () => {
    let activeInstanceId = instanceId

    // Resolve instanceId from taskId if needed
    if (!activeInstanceId && taskId) {
      try {
        setLoading(true)
        const res = await apiClient.get<any>(`/api/workflow/tasks/${taskId}/detail`)
        if (res?.success && res.data?.instanceId) {
          activeInstanceId = res.data.instanceId
          setInstanceId(activeInstanceId)
        } else {
          error(t('workflow.error.load_failed'))
          setLoading(false)
          return
        }
      } catch (e) {
        error(t('workflow.error.load_failed'))
        setLoading(false)
        return
      }
    }

    if (!activeInstanceId) return
    try {
      setLoading(true)

      const res = await apiClient.get<any>(`/api/workflow/tasks/timeline/${activeInstanceId}`)
      if (!res || !res.success || !res.data) {
        // Don't show error if we are just transitioning from taskId to instanceId
        if (!loading) error(t('workflow.error.load_failed'))
        return
      }

      const data = res.data
      const rawInstance = data.instance
      const rawTimeline = data.timeline || []
      const rawCurrentTasks = data.currentTasks || []

      if (!rawInstance) {
        setInstance(null)
        return
      }

      let formData = rawInstance.form_data || rawInstance.variables?.formData || {}
      if (typeof formData === 'string') {
        try { formData = JSON.parse(formData) } catch { formData = {} }
      }
      if (formData && formData.formData && typeof formData.formData === 'object') {
        formData = { ...formData, ...formData.formData }
      }

      const mappedInstance: WorkflowInstance = {
        id: rawInstance.id || '',
        definition_id: rawInstance.definition_id || rawInstance.definitionId || '',
        definition_key: rawInstance.definition_key || rawInstance.flowCode || 'unknown',
        title: rawInstance.title || rawInstance.business_id || '未命名流程',
        status: rawInstance.status || rawInstance.flowStatus || 'running',
        result: rawInstance.result || null,
        initiator_id: rawInstance.initiator_id || rawInstance.createBy || '',
        initiator_name: rawInstance.initiator_name || rawInstance.createBy || '',
        start_time: rawInstance.start_time || rawInstance.createTime || '',
        end_time: rawInstance.end_time || null,
        current_node_id: rawInstance.current_node_id || rawInstance.nodeCode || null,
        current_node_name: rawInstance.current_node_name || rawInstance.nodeName || null,
        business_id: rawInstance.business_id || rawInstance.businessId || null,
        variables: { formData, ...rawInstance.variables },
      }
      setInstance(mappedInstance)
      setActiveFormData(formData)

      const mappedLogs: WorkflowLog[] = rawTimeline.map((log: any) => ({
        id: log.id || '',
        action: log.action || (log.skipType === 'reject' ? 'rejected' :
          log.skipType === 'rollback' ? 'rollback' :
            log.skipType === 'pass' ? 'approved' :
              log.skipType === 'auto_skip' ? 'auto_skip' :
                log.skipType === 'add_signer' ? 'add_signer' :
                  log.skipType === 'cc' ? 'cc' :
                    log.skipType === 'transfer' ? 'transfer' :
                      log.cooperateType === 2 ? 'transfer' :
                        log.cooperateType === 6 ? 'add_signer' : 'approved'),
        node_id: log.node_id || log.nodeCode || '',
        node_name: log.node_name || log.nodeName || '',
        status: log.status || log.flowStatus || 'completed',
        operator_id: log.operator_id || log.approver || '',
        operator_name: log.operator_name || log.approver || t('common.system'),
        comment: log.comment || log.message || '',
        created_at: log.created_at || log.createTime || '',
      }))
      setLogs(mappedLogs)

      const mappedTasks: WorkflowTask[] = rawCurrentTasks.map((task: any) => ({
        id: task.id?.toString() || '',
        name: task.name || task.nodeName || '',
        node_id: task.node_id || task.nodeCode || '',
        status: task.status || (task.flowStatus === 'todo' ? 'assigned' : task.flowStatus) || 'assigned',
        assignee_id: task.assignee_id || task.approver || task.createBy || '',
        assignee_name: task.assignee_name || task.approver || task.createBy || '',
        result: task.result || null,
        comment: task.comment || task.message || null,
        created_at: task.created_at || task.createTime || '',
        completed_at: task.completed_at || null,
      }))
      setTasks(mappedTasks)

      const myTask = mappedTasks.length > 0 ? mappedTasks[0] : null
      setCurrentTask(myTask)

      if (mappedInstance.definition_id) {
        try {
          const defRes = await apiClient.get<any>(`/api/workflow/definitions/${mappedInstance.definition_id}`)
          if (defRes?.success && defRes.data) {
            const defData = defRes.data
            setDefinition(defData)

            let fields = defData.form_schema || defData.form_fields || []
            if (typeof fields === 'string') {
              try { fields = JSON.parse(fields) } catch { fields = [] }
            }
            if (!Array.isArray(fields)) fields = []
            setFormFields(fields)

            if (fields.length === 0 && formData && Object.keys(formData).length > 0) {
              const autoFields = Object.keys(formData).map(key => ({
                name: key,
                label: key,
                type: 'text',
                required: false,
              }))
              setFormFields(autoFields)
            }
          }
        } catch (e) {
          console.warn('Failed to load definition, auto-generating form fields from data')
          if (formData && Object.keys(formData).length > 0) {
            const autoFields = Object.keys(formData).map(key => ({
              name: key,
              label: key,
              type: 'text',
              required: false,
            }))
            setFormFields(autoFields)
          }
        }
      } else if (formData && Object.keys(formData).length > 0) {
        const autoFields = Object.keys(formData).map(key => ({
          name: key,
          label: key,
          type: 'text',
          required: false,
        }))
        setFormFields(autoFields)
      }

    } catch (e: any) {
      console.error(e)
      error(t('workflow.error.load_failed'))
    } finally {
      setLoading(false)
    }
  }, [instanceId, t, error])

  useEffect(() => {
    loadInstanceData()
  }, [loadInstanceData])

  const getNodeActions = () => {
    if (!currentTask) return []
    return [
      { type: 'approve', label: t('workflow.action.approve'), icon: 'CheckCircle', className: 'bg-emerald-600' },
      { type: 'reject', label: t('workflow.action.reject'), icon: 'XCircle', className: 'bg-rose-600' },
      { type: 'return', label: t('workflow.action.return'), icon: 'RotateCcw', className: 'bg-amber-600' },
      { type: 'transfer', label: t('workflow.action.transfer'), icon: 'Share2', className: 'bg-purple-600' },
      { type: 'cc', label: t('workflow.action.cc') || '抄送', icon: 'ClipboardCopy', className: 'bg-indigo-600' }
    ]
  }

  const handleWithdraw = async () => {
    if (!instanceId) return
    if (!(await confirm({ title: t('workflow.message.confirm_withdraw') || t('workflow.action.confirm_withdraw'), content: t('workflow.message.confirm_withdraw_desc') || t('workflow.action.confirm_withdraw_desc') }))) return
    try {
      const res = await apiClient.post<any>(`/api/workflow/processes/${instanceId}/withdraw`, {})
      if (res.success) {
        success(t('common.success'))
        loadInstanceData()
      }
    } catch (e: any) { error(e.message || t('common.error')) }
  }

  const submitAction = async (action: string, params: any) => {
    if (!currentTask) return false
    try {
      let res: any;
      const taskId = String(currentTask.id);
      const instId = instanceId ? String(instanceId) : '';

      if (action === 'approve') {
        res = await apiClient.post(`/api/workflow/complete`, { taskId, comment: params.comment, variables: params.variables })
      } else if (action === 'reject') {
        res = await apiClient.post(`/api/workflow/reject`, { taskId, comment: params.comment })
      } else if (action === 'return') {
        res = await apiClient.post(`/api/workflow/rollback`, { taskId, comment: params.comment, targetNodeCode: params.targetNodeId })
      } else if (action === 'transfer') {
        const targetId = params.targetUser?.id ? String(params.targetUser.id) : '';
        res = await apiClient.post(`/api/workflow/tasks/${taskId}/transfer`, { targetUserId: targetId, comment: params.comment })
      } else if (action === 'cc') {
        const userIds = (params.signers || []).map((s: any) => String(s.id));
        res = await apiClient.post(`/api/workflow/copy`, { instanceId: instId, userIds })
      } else if (action === 'addSigner') {
        const userIds = (params.signers || []).map((s: any) => String(s.id));
        res = await apiClient.post(`/api/workflow/add-signer`, { instanceId: instId, userIds })
      }

      if (res && res.success) {
        success(t('common.success'))
        navigate('/approvals/pending')
        return true
      }
      return false
    } catch (e: any) {
      error(e.message || t('common.error'))
      return false
    }
  }

  return {
    loading, instance, definition, tasks, logs, currentTask, currentUserId,
    formFields, activeFormData, setActiveFormData, masterData, transferOrder, repairOrder,
    loadInstanceData, getNodeActions, submitAction, handleWithdraw, confirm,
    success, error, warning, t
  }
}
