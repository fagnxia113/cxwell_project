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
  const { instanceId } = useParams<{ instanceId: string }>()
  const navigate = useNavigate()
  const { success, error, warning } = useMessage()
  const { confirm } = useConfirm()

  const [loading, setLoading] = useState(true)
  const [instance, setInstance] = useState<WorkflowInstance | null>(null)
  const [definition, setDefinition] = useState<any>(null)
  const [tasks, setTasks] = useState<WorkflowTask[]>([])
  const [logs, setLogs] = useState<WorkflowLog[]>([])
  const [currentTask, setCurrentTask] = useState<WorkflowTask | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [formFields, setFormFields] = useState<any[]>([])
  const [activeFormData, setActiveFormData] = useState<any>({})

  // Master Data Maps
  const [masterData, setMasterData] = useState({
    depts: {} as Record<string, string>,
    positions: {} as Record<string, string>,
    warehouses: {} as Record<string, string>,
    projects: {} as Record<string, string>,
    users: {} as Record<string, string>,
    customers: {} as Record<string, string>
  })

  // Business State
  const [transferOrder, setTransferOrder] = useState<any>(null)
  const [repairOrder, setRepairOrder] = useState<any>(null)
  const [scrapSaleOrder, setScrapSaleOrder] = useState<any>(null)

  // Fetching Master Data
  const { data: deptsData } = useFetch(['departments'], '/api/organization/departments')
  const { data: positionsData } = useFetch(['positions'], '/api/organization/positions')
  const { data: warehousesData } = useFetch(['warehouses'], '/api/warehouses')
  const { data: projectsData } = useFetch(['projects'], '/api/projects')
  const { data: employeesData } = useFetch(['employees'], '/api/personnel/employees?pageSize=1000')
  const { data: customersData } = useFetch(['customers'], '/api/customers')

  // Sync Maps
  useEffect(() => {
    const newMaps = { ...masterData }
    if (deptsData?.data) newMaps.depts = Object.fromEntries(deptsData.data.map((d: any) => [d.id, d.name]))
    if (positionsData?.data) newMaps.positions = Object.fromEntries(positionsData.data.map((p: any) => [p.id, p.name]))
    if (warehousesData?.data) newMaps.warehouses = Object.fromEntries(warehousesData.data.map((w: any) => [w.id, w.name]))
    if (projectsData?.data) newMaps.projects = Object.fromEntries(projectsData.data.map((p: any) => [p.id, p.name]))
    if (customersData?.data) newMaps.customers = Object.fromEntries(customersData.data.map((c: any) => [c.id, c.name]))
    
    if (employeesData?.data) {
      const uMap: Record<string, string> = {}
      employeesData.data.forEach((u: any) => {
        uMap[u.id] = u.name
        if (u.user_id) uMap[u.user_id] = u.name
      })
      newMaps.users = uMap
    }
    setMasterData(newMaps)
  }, [deptsData, positionsData, warehousesData, projectsData, employeesData, customersData])

  const loadInstanceData = useCallback(async () => {
    if (!instanceId) return
    try {
      setLoading(true)
      const instanceRes = await apiClient.get<any>(`/api/workflow/processes/${instanceId}`)
      const instanceData = instanceRes?.data || instanceRes
      if (!instanceData) return
      setInstance(instanceData)

      // Variables parsing
      let vars = instanceData.variables
      if (typeof vars === 'string') {
        try { vars = JSON.parse(vars) } catch (e) { vars = { formData: {} } }
      }
      const formData = vars?.formData || {}
      setActiveFormData(formData)

      // Definition
      if (instanceData.definition_id) {
        const defRes = await apiClient.get<any>(`/api/workflow/definitions/${instanceData.definition_id}`)
        const defData = defRes?.data || defRes
        if (defData) {
          setDefinition(defData)
          if (defData.form_template_id) {
            const tmplRes = await apiClient.get<any>(`/api/workflow/form-templates/${defData.form_template_id}`)
            const tmplData = tmplRes?.data || tmplRes
            if (tmplData?.fields) setFormFields(tmplData.fields)
          } else {
            const schema = defData.form_schema
            setFormFields(Array.isArray(schema) ? schema : (schema?.fields || []))
          }
        }
      }

      // Tasks & Logs
      const [tasksRes, logsRes] = await Promise.all([
        apiClient.get<any>(`/api/workflow/v2/process/instance/${instanceId}/tasks`),
        apiClient.get<any>(`/api/workflow/v2/process/instance/${instanceId}/logs`)
      ])

      const tasksData = tasksRes?.data || tasksRes
      const logsData = logsRes?.data || logsRes

      if (tasksData) {
        setTasks(tasksData)
        const token = localStorage.getItem('token')
        if (token) {
          const payload = parseJWTToken(token)
          const userId = payload?.userId || payload?.id
          if (userId) {
            setCurrentUserId(userId)
            const myTask = tasksData.find((t: any) => t.assignee_id === userId && t.status === 'assigned')
            setCurrentTask(myTask || null)
          }
        }
      }

      if (logsData) {
        setLogs(logsData.map((log: any) => ({
          id: log.id,
          action: log.action,
          node_id: log.nodeId,
          node_name: log.nodeType,
          status: log.result || 'completed',
          operator_id: log.operator?.id || log.initiator?.id,
          operator_name: log.operator?.name || log.initiator?.name || t('common.system'),
          comment: log.reason || log.result,
          created_at: log.timestamp
        })))
      }

      // Business specific data
      const defKey = instanceData.definition_key || formData.definition_key
      const isTransfer = defKey?.includes('equipment_transfer')
      const isRepair = defKey === 'equipment-repair'
      const isScrap = defKey === 'equipment-scrap-sale'
      const businessId = instanceData.business_id || formData.transferOrderId || formData.repairOrderId || formData.scrapSaleOrderId

      if (isTransfer && businessId) {
        apiClient.get<any>(`/api/equipment/transfers/${businessId}`).then(res => setTransferOrder(res?.data || res))
      }
      if (isRepair && businessId) {
        apiClient.get<any>(`/api/equipment/repairs/${businessId}`).then(res => setRepairOrder(res?.data || res))
      }
      if (isScrap && businessId) {
        apiClient.get<any>(`/api/equipment/scrap-sales/${businessId}`).then(res => setScrapSaleOrder(res?.data || res))
      }

    } catch (e) {
      error(t('workflow.error.load_failed'))
      navigate(-1)
    } finally {
      setLoading(false)
    }
  }, [instanceId, navigate, t, error])

  useEffect(() => {
    loadInstanceData()
  }, [loadInstanceData])

  // --- Actions ---

  const getOperator = () => {
    const token = localStorage.getItem('token')
    if (!token) return { id: 'current-user', name: t('common.currentUser') }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return { id: payload.id, name: payload.name || payload.username || t('common.currentUser') }
    } catch (e) {
      return { id: 'current-user', name: t('common.currentUser') }
    }
  }

  const getNodeActions = () => {
    if (!currentTask || !definition) return []
    const currentNode = definition.node_config?.nodes?.find((node: any) => node.id === currentTask.node_id)
    const allowed = currentNode?.actions?.allowed || ['approve', 'reject']
    const config: any = {
      approve: { type: 'approve', label: t('workflow.action.approve'), icon: 'CheckCircle', className: 'bg-emerald-600' },
      reject: { type: 'reject', label: t('workflow.action.reject'), icon: 'XCircle', className: 'bg-rose-600' },
      return: { type: 'return', label: t('workflow.action.return'), icon: 'RotateCcw', className: 'bg-amber-600' },
      transfer: { type: 'transfer', label: t('workflow.action.transfer'), icon: 'User', className: 'bg-purple-600' },
      addSigner: { type: 'addSigner', label: t('workflow.action.addSigner'), icon: 'UserPlus', className: 'bg-teal-600' }
    }
    return allowed.filter((a: string) => config[a]).map((a: string) => config[a])
  }

  const handleWithdraw = async () => {
    if (!instance) return
    if (!(await confirm({ title: t('workflow.message.confirm_withdraw'), content: t('workflow.message.confirm_withdraw_desc') }))) return
    try {
      await apiClient.post(`/api/workflow/processes/${instance.id}/withdraw`)
      success(t('common.success'))
      loadInstanceData()
    } catch (e: any) { error(e.message || t('common.error')) }
  }

  const submitAction = async (action: string, params: any) => {
    if (!currentTask) return
    try {
      if (action === 'approve') {
        const payload = { ...params, action: 'approve', operator: getOperator() }
        await apiClient.post(`/api/workflow/v2/task/${currentTask.id}/complete`, payload)
      } else if (action === 'reject') {
        await apiClient.post(`/api/workflow/v2/task/${currentTask.id}/complete`, { action: 'reject', comment: params.comment, operator: getOperator() })
      } else if (action === 'return') {
        await apiClient.post(`/api/workflow/v2/task/${currentTask.id}/rollback`, { targetNodeId: params.targetNodeId, comment: params.comment, operator: getOperator() })
      } else if (action === 'transfer') {
        await apiClient.post(`/api/workflow/v2/task/${currentTask.id}/transfer`, { targetUser: params.targetUser, comment: params.comment, operator: getOperator() })
      } else if (action === 'addSigner') {
        await apiClient.post(`/api/workflow/v2/task/${currentTask.id}/add-signer`, { signers: params.signers, comment: params.comment, operator: getOperator() })
      }
      success(t('common.success'))
      loadInstanceData()
      return true
    } catch (e: any) {
      error(e.message || t('common.error'))
      return false
    }
  }

  return {
    loading,
    instance,
    definition,
    tasks,
    logs,
    currentTask,
    currentUserId,
    formFields,
    activeFormData,
    masterData,
    transferOrder,
    repairOrder,
    scrapSaleOrder,
    loadInstanceData,
    getNodeActions,
    submitAction,
    handleWithdraw,
    confirm,
    success,
    error,
    warning,
    t
  }
}
