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
      
      // 1. 获取流程流转时间轴 (Timeline/Logs)
      const logsRes = await workflowApi.getTimeline(instanceId)
      if (logsRes && logsRes.success) {
        setLogs(logsRes.data.map((log: any) => ({
          id: log.id.toString(),
          action: log.skipType === '1' ? 'reject' : 'approve',
          node_id: log.nodeCode,
          node_name: log.nodeName,
          status: 'completed',
          operator_name: log.approver || t('common.system'),
          comment: log.message || '',
          created_at: log.updateTime
        })))
      }

      // 2. 获取当前待办任务 (如果是当前处理人)
      const todoRes = await workflowApi.getTodoTasks()
      if (todoRes && todoRes.success) {
        const myTask = todoRes.data.find((t: any) => t.instanceId.toString() === instanceId)
        if (myTask) {
          setCurrentTask({
            ...myTask,
            id: myTask.id.toString(),
            node_id: myTask.nodeCode,
            node_name: myTask.nodeName
          })
          
          // 获取关联的实例与定义信息
          setInstance(myTask.instance)
          if (myTask.instance?.definitionId) {
             const defRes = await workflowApi.getDefinitionDetail(myTask.instance.definitionId.toString())
             if (defRes.success) {
               setDefinition(defRes.data)
               // 重构表单字段逻辑 (此处暂且简单处理)
               setFormFields([]) 
             }
          }
        }
      }

      // 3. 业务特定数据加载 (项目/设备等)
      // TODO: 后续根据 Phase 5 的业务模块实现进行对接

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

  // --- Actions ---

  const getNodeActions = () => {
    if (!currentTask) return []
    // 新引擎默认开启所有基础操作：审批、驳回、退回
    return [
      { type: 'approve', label: t('workflow.action.approve'), icon: 'CheckCircle', className: 'bg-emerald-600' },
      { type: 'reject', label: t('workflow.action.reject'), icon: 'XCircle', className: 'bg-rose-600' },
      { type: 'return', label: t('workflow.action.return'), icon: 'RotateCcw', className: 'bg-amber-600' }
    ]
  }

  const handleWithdraw = async () => {
    if (!instanceId) return
    if (!(await confirm({ title: t('workflow.message.confirm_withdraw'), content: t('workflow.message.confirm_withdraw_desc') }))) return
    try {
      const res = await workflowApi.cancelProcess(instanceId)
      if (res.success) {
        success(t('common.success'))
        loadInstanceData()
      }
    } catch (e: any) { error(e.message || t('common.error')) }
  }

  const submitAction = async (action: string, params: any) => {
    if (!currentTask) return
    try {
      let res;
      if (action === 'approve') {
        res = await workflowApi.completeTask(currentTask.id, {}, params.comment)
      } else if (action === 'reject') {
        res = await workflowApi.rejectTask(currentTask.id, params.comment)
      } else if (action === 'return') {
        res = await workflowApi.rejectTask(currentTask.id, params.comment, params.targetNodeId)
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
