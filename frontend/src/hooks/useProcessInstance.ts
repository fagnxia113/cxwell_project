import { useState, useEffect, useCallback } from 'react'
import { API_URL } from '../config/api'
import { apiClient } from '../utils/apiClient'
import { useMessage } from './useMessage'
import { useConfirm } from './useConfirm'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

export interface FormField {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'user' | 'boolean' | 'lookup' | 'reference'
  required: boolean
  options?: { label: string; value: any }[]
  businessConfig?: {
    module?: string
    entityType?: string
    lookupField?: string
    displayField?: string
  }
  refEntity?: string
  refLabel?: string
  refValue?: string
}

export interface ProcessInstance {
  id: string
  definition_id: string
  definition_key: string
  title: string
  status: string
  result: string | null
  variables: {
    formData: Record<string, any>
  }
  initiator_id: string
  initiator_name: string
  start_time: string
  end_time: string | null
  current_node_id: string | null
  current_node_name: string | null
  business_id: string | null
}

export interface Task {
  id: string
  name: string
  node_id: string
  status: string
  assignee_id: string
  assignee_name: string
  result: string | null
  comment: string | null
  created_at: string
  completed_at: string | null
}

export interface ExecutionLog {
  id: string
  action: string
  node_id: string
  node_name?: string
  status: string
  operator_id?: string
  operator_name?: string
  comment?: string
  created_at: string
}

export function useProcessInstance(instanceId: string | undefined) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { success, error, warning } = useMessage()
  const { confirm } = useConfirm()

  const [loading, setLoading] = useState(true)
  const [instance, setInstance] = useState<ProcessInstance | null>(null)
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [logs, setLogs] = useState<ExecutionLog[]>([])
  const [currentTask, setCurrentTask] = useState<Task | null>(null)
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, { label: string; value: any }[]>>({})
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      setCurrentUser(JSON.parse(userStr))
    }
  }, [])

  const loadDynamicOptions = async (fields: FormField[]) => {
    const options: Record<string, { label: string; value: any }[]> = {}

    for (const field of fields) {
      if (field.name === 'department_id' || field.name === 'department') {
        try {
          const items = await apiClient.get<any[]>(`${API_URL.BASE}/api/organization/departments`)
          options[field.name] = (items || []).map((item: any) => ({ label: item.name, value: item.id }))
        } catch (e) { console.error(`Failed to load department options:`, e) }
      }
      else if (field.name === 'position_id' || field.name === 'position') {
        try {
          const items = await apiClient.get<any[]>(`${API_URL.BASE}/api/organization/positions`)
          options[field.name] = (items || []).map((item: any) => ({ label: item.name, value: item.id }))
        } catch (e) { console.error(`Failed to load position options:`, e) }
      }
      else if (field.businessConfig?.entityType) {
        try {
          const items = await apiClient.get<any[]>(`${API_URL.BASE}/api/data/${field.businessConfig.entityType}`)
          const labelField = field.businessConfig.displayField || 'name'
          const valueField = field.businessConfig.lookupField || 'id'
          options[field.name] = (items || []).map((item: any) => ({ label: item[labelField], value: item[valueField] }))
        } catch (e) { console.error(`Failed to load ${field.label} options:`, e) }
      }
      else if (field.refEntity === 'Customer' || field.name === 'customer_id') {
        try {
          const items = await apiClient.get<any[]>(`${API_URL.BASE}/api/customers`)
          options[field.name] = (items || []).map((item: any) => ({ label: item.name, value: item.id }))
        } catch (e) { console.error(`Failed to load customer options:`, e) }
      }
      else if (field.type === 'user') {
        try {
          const items = await apiClient.get<any[]>(`${API_URL.BASE}/api/data/Employee`)
          options[field.name] = (items || []).map((item: any) => ({
            label: `${item.name}${item.position_name ? ` (${item.position_name})` : ''}`,
            value: item.id
          }))
        } catch (e) { console.error('Failed to load employee options:', e) }
      }
      else if (field.options) {
        options[field.name] = field.options
      }
    }
    setDynamicOptions(options)
  }

  const loadInstanceData = useCallback(async () => {
    if (!instanceId) return
    try {
      setLoading(true)
      
      // 并行请求以提高效率
      const [instanceRes, tasksRes, logsRes] = await Promise.all([
        apiClient.get<any>(`${API_URL.BASE}/api/workflow/processes/${instanceId}`),
        apiClient.get<any>(`${API_URL.BASE}/api/workflow/v2/tasks/instance/${instanceId}`),
        apiClient.get<any>(`${API_URL.BASE}/api/workflow/processes/${instanceId}/logs`)
      ])

      const instanceData = instanceRes?.data || instanceRes
      if (!instanceData) throw new Error(t('workflow.error.instance_not_found'))
      setInstance(instanceData)

      // 解析定义以获取表单 Schema
      const definitionRes = await apiClient.get<any>(`${API_URL.BASE}/api/workflow/definitions/${instanceData.definition_id}`)
      const definitionData = definitionRes?.data || definitionRes
      if (definitionData && definitionData.form_schema) {
        setFormFields(definitionData.form_schema)
        await loadDynamicOptions(definitionData.form_schema)
      }

      const tasksData = tasksRes?.data || tasksRes
      setTasks(tasksData || [])

      const logsData = logsRes?.data || logsRes
      setLogs(logsData || [])

      // 寻找当前用户的待办任务
      const userStr = localStorage.getItem('user')
      const userId = userStr ? JSON.parse(userStr).id : null
      const pendingTask = (tasksData || []).find(
        (t: Task) => t.assignee_id === userId && ['assigned', 'in_progress'].includes(t.status)
      )
      setCurrentTask(pendingTask || null)

    } catch (err) {
      console.error(t('workflow.error.load_failed'), err)
      error(t('workflow.error.load_failed'))
    } finally {
      setLoading(false)
    }
  }, [instanceId, t, error])

  useEffect(() => {
    loadInstanceData()
  }, [loadInstanceData])

  const handleWithdraw = async () => {
    const isConfirmed = await confirm({
      title: t('workflow.action.confirm_withdraw'),
      content: t('workflow.message.confirm_withdraw_desc')
    })

    if (!isConfirmed) return

    try {
      await apiClient.post(`${API_URL.BASE}/api/workflow/processes/${instance?.id}/withdraw`)
      success(t('workflow.message.withdrawn_success'))
      await loadInstanceData()
    } catch (err) {
      console.error('Failed to withdraw:', err)
      error(t('common.error'))
    }
  }

  const completeTask = async (action: 'approve' | 'reject', comment: string, formData: Record<string, any> = {}) => {
    if (!currentTask) return
    try {
      await apiClient.post(`${API_URL.BASE}/api/workflow/v2/tasks/${currentTask.id}/complete`, {
        action,
        comment: comment.trim(),
        formData
      })
      success(t('workflow.message.action_success'))
      await loadInstanceData()
      return true
    } catch (err) {
      console.error(t('workflow.error.action_failed'), err)
      error(t('workflow.error.action_failed'))
      return false
    }
  }

  return {
    instance,
    formFields,
    tasks,
    logs,
    loading,
    currentTask,
    dynamicOptions,
    currentUser,
    loadInstanceData,
    handleWithdraw,
    completeTask
  }
}
