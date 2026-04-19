// ============================================================
// 📦 项目详情页数据加载 + CRUD 逻辑 Hook
// 精简点：原来 loadProjectData / handleSave / handleDelete /
//         loadWorkflowData / handleApproveAction / handleWithdraw
//         全部混在组件里（约 200 行逻辑），现在抽成独立 Hook。
//         组件只负责界面，不再关心「怎么取数据」。
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '../utils/apiClient'
import { useMessage } from './useMessage'
import { useConfirm } from './useConfirm'
import { useTranslation } from 'react-i18next'
import type {
  Project, Phase, Task, Milestone, ProjectPersonnel,
  ProjectAsset, KnowledgeItem, UserInfo,
  WorkflowInstance, WorkflowTask, WorkflowLog,
  ProjectExpense, ProjectRisk, ProjectStaffingPlan,
} from '../types/project'

// ---------- Hook 主体 ----------

export function useProjectDetail(id: string | undefined) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { success, error: showError } = useMessage()
  const { confirm } = useConfirm()

  // ---- 核心状态 ----
  const [project, setProject] = useState<Project | null>(null)
  const [phases, setPhases] = useState<Phase[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [personnel, setPersonnel] = useState<ProjectPersonnel[]>([])
  const [assets, setAssets] = useState<ProjectAsset[]>([])
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([])
  const [expenses, setExpenses] = useState<ProjectExpense[]>([])
  const [risks, setRisks] = useState<ProjectRisk[]>([])
  const [staffingPlans, setStaffingPlans] = useState<ProjectStaffingPlan[]>([])

  // ---- 编辑状态 ----
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Project>>({})

  // ---- 用户 ----
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null)

  // ---- 工作流状态 ----
  const [workflowInstance, setWorkflowInstance] = useState<WorkflowInstance | null>(null)
  const [workflowTasks, setWorkflowTasks] = useState<WorkflowTask[]>([])
  const [workflowLogs, setWorkflowLogs] = useState<WorkflowLog[]>([])
  const [currentTask, setCurrentTask] = useState<WorkflowTask | null>(null)
  const [workflowLoading, setWorkflowLoading] = useState(false)

  // ---- 初始化用户 ----
  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      setCurrentUser(JSON.parse(userStr))
    }
  }, [])

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'root'

  // ---- 加载项目数据 ----
  const loadProjectData = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)

      // 使用 Promise.allSettled 进行并行请求，大幅提升性能 (优化点 B5)
      const [projectRes, structureRes, personnelRes, milestoneRes] = await Promise.allSettled([
        apiClient.get<any>(`/api/projects/${id}`),
        apiClient.get<any>(`/api/projects/${id}/structure`),
        apiClient.get<any>(`/api/projects/personnel-mgmt/${id}/personnel`),
        apiClient.get<any>(`/api/milestones/project/${id}`)
      ])

      // 1. 处理项目基础信息
      if (projectRes.status === 'fulfilled') {
        const data = projectRes.value?.data || projectRes.value
        if (data) {
          setProject(data)
          setEditForm(data)
        }
      }

      // 2. 处理项目结构 & 阶段
      if (structureRes.status === 'fulfilled') {
        const allTasks: Task[] = structureRes.value?.data || structureRes.value || []
        setTasks(allTasks)

        const phasesFromTasks = allTasks
          .filter(t => t.task_type === 'milestone')
          .map(m => ({
            id: m.id,
            phase_name: m.name,
            status: m.status,
            planned_start_date: m.planned_start_date,
            planned_end_date: m.planned_end_date,
            actual_start_date: '',
            actual_end_date: '',
            progress: m.progress,
            warning_level: 'normal',
            manager: m.assignee || t('common.noData'),
          }))
        setPhases(phasesFromTasks)
      }

      // 3. 处理人员信息
      if (personnelRes.status === 'fulfilled') {
        const pData = personnelRes.value
        setPersonnel(pData?.data || pData?.items || pData || [])
      }

      // 4. 处理里程碑信息
      if (milestoneRes.status === 'fulfilled') {
        const mData: Milestone[] = milestoneRes.value?.data || []
        setMilestones(mData)
        
        // 优化点：同步侧边栏「节点状态」数据
        // 如果有真实的里程碑数据，则优先将其映射为 phases 供侧边栏使用
        if (mData.length > 0) {
          const phasesFromMilestones: Phase[] = mData.map(m => ({
            id: m.id,
            phase_name: m.name,
            status: m.status,
            planned_start_date: m.planned_start_date,
            planned_end_date: m.planned_end_date,
            actual_start_date: '',
            actual_end_date: m.actual_end_date || '',
            progress: m.progress,
            warning_level: 'normal',
            manager: t('common.noData'),
          }))
          setPhases(phasesFromMilestones)
        }
      }

    } catch (error: any) {
      console.error('Project data loading error:', error)
      showError(error.message || t('common.error'))
    } finally {
      setLoading(false)
    }
  }, [id, t, showError])

  // ---- 加载扩展模块数据 ----
  const loadExtensionData = useCallback(async () => {
    if (!id) return
    try {
      const [expensesRes, risksRes, staffingRes] = await Promise.allSettled([
        apiClient.get<any>(`/api/projects/extensions/${id}/expenses`),
        apiClient.get<any>(`/api/projects/extensions/${id}/risks`),
        apiClient.get<any>(`/api/projects/extensions/${id}/staffing-plans`)
      ])

      if (expensesRes.status === 'fulfilled') setExpenses(expensesRes.value?.data || [])
      if (risksRes.status === 'fulfilled') setRisks(risksRes.value?.data || [])
      if (staffingRes.status === 'fulfilled') setStaffingPlans(staffingRes.value?.data || [])
    } catch (error: any) {
      console.error('Extension data loading error:', error)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      loadProjectData()
      loadExtensionData()
    }
  }, [id, loadProjectData, loadExtensionData])

  // ---- CRUD 操作 ----

  const handleEdit = () => setIsEditing(true)

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditForm(project || {})
  }

  const handleSave = async () => {
    try {
      const result = await apiClient.put<any>(`/api/projects/${id}`, editForm)
      if (result?.success || result?.id) {
        setProject(result.data || result)
        setIsEditing(false)
        success(t('common.success'))
      } else {
        throw new Error(t('common.error'))
      }
    } catch (err: any) {
      showError(err.message || t('common.error'))
    }
  }

  const handleDelete = async () => {
    if (!project) return
    if (!(await confirm({
      title: t('common.confirm') + ' ' + t('common.delete'),
      content: `${t('common.delete')} "${project.name}"?`,
      type: 'danger',
    }))) return

    try {
      const result = await apiClient.delete<any>(`/api/projects/${id}`)
      if (result?.success || result?.id) {
        success(t('common.delete') + ' ' + t('common.success'))
        navigate('/projects')
      } else {
        throw new Error(t('common.error'))
      }
    } catch (err: any) {
      showError(err.message || t('common.error'))
    }
  }

  // ---- 工作流操作 ----

  const loadWorkflowData = useCallback(async () => {
    if (!id) return
    try {
      setWorkflowLoading(true)
      const instanceResult = await apiClient.get<any>(`/api/workflow/processes/business/${id}`)
      if (instanceResult?.success && instanceResult.data) {
        setWorkflowInstance(instanceResult.data)

        const [tasksRes, logsRes] = await Promise.allSettled([
          apiClient.get<any>(`/api/workflow/v2/process/instance/${instanceResult.data.id}/tasks`),
          apiClient.get<any>(`/api/workflow/v2/process/instance/${instanceResult.data.id}/logs`)
        ])

        if (tasksRes.status === 'fulfilled' && tasksRes.value?.success) {
          const tData = tasksRes.value.data || []
          setWorkflowTasks(tData)
          const activeTask = tData.find(
            (t: WorkflowTask) => t.status === 'assigned' || t.status === 'in_progress'
          )
          setCurrentTask(activeTask || null)
        }

        if (logsRes.status === 'fulfilled' && logsRes.value?.success) {
          setWorkflowLogs(logsRes.value.data || [])
        }
      }
    } catch (error: any) {
      console.error('Workflow data loading error:', error)
      showError(error.message || t('common.error'))
    } finally {
      setWorkflowLoading(false)
    }
  }, [id, t, showError])

  const handleApproveAction = async (
    actionType: 'approve' | 'reject',
    comment: string
  ) => {
    if (!currentTask) {
      showError(t('project.fields.no_active_tasks'))
      return false
    }
    if (actionType === 'reject' && !comment.trim()) {
      showError(t('project.fields.reject_reason_required'))
      return false
    }
    try {
      const result = await apiClient.post<any>(`/api/workflow/v2/task/${currentTask.id}/complete`, {
        action: actionType,
        comment: comment.trim(),
      })
      if (result?.success) {
        success(
          actionType === 'approve'
            ? t('workflow.action.approve_success') || 'Approved'
            : t('workflow.action.reject_success') || 'Rejected'
        )
        loadWorkflowData()
        return true
      } else {
        showError(result?.error || t('common.error'))
        return false
      }
    } catch (error: any) {
      console.error('Approval action error:', error)
      showError(error.message || t('common.error'))
      return false
    }
  }

  const handleWithdraw = async () => {
    if (!workflowInstance) return
    if (!(await confirm({
      title: t('workflow.action.withdraw'),
      content: t('workflow.action.confirm_withdraw_desc'),
      type: 'warning',
    }))) return

    try {
      const result = await apiClient.post<any>(`/api/workflow/processes/${workflowInstance.id}/withdraw`)
      if (result?.success || result?.id) {
        success(t('workflow.action.withdrawn_success'))
        loadWorkflowData()
      } else {
        showError(t('common.error'))
      }
    } catch {
      showError(t('common.error'))
    }
  }

  const updatePersonnelPermission = async (employeeId: string, canEdit: boolean) => {
    try {
      if (!id) return
      const result = await apiClient.put<any>(`/api/projects/extensions/${id}/personnel/${employeeId}/permission`, { canEdit })
      if (result?.success) {
        setPersonnel(prev => prev.map(p => 
          p.employee_id === employeeId ? { ...p, can_edit: canEdit } : p
        ))
        success(t('common.success'))
      }
    } catch (err: any) {
      showError(err.message || t('common.error'))
    }
  }

  const addPersonnel = async (data: { employeeId: string, roleInProject?: string, transferInDate?: string }) => {
    try {
      if (!id) return
      const res = await apiClient.post<any>(`/api/projects/personnel-mgmt/${id}/personnel/add`, data)
      if (res?.success) {
        success(t('common.success'))
        loadProjectData()
      }
    } catch (err: any) {
      showError(err.message || t('common.error'))
    }
  }

  const transferPersonnel = async (data: { employeeId: string, targetProjectId: string, transferDate: string, remark?: string }) => {
    try {
      if (!id) return
      const res = await apiClient.post<any>(`/api/projects/personnel-mgmt/${id}/personnel/transfer`, data)
      if (res?.success) {
        success(t('common.success'))
        loadProjectData()
      }
    } catch (err: any) {
      showError(err.message || t('common.error'))
    }
  }

  const removePersonnel = async (employeeId: string, data?: { transferOutDate?: string, remark?: string }) => {
    try {
      if (!id) return
      if (!(await confirm({
        title: (t('common.confirm') || 'Confirm') + ' ' + (t('common.delete') || 'Delete'),
        content: t('personnel.confirm_remove_desc') || 'Are you sure you want to remove this person from the project?',
        type: 'danger',
      }))) return

      const res = await apiClient.post<any>(`/api/projects/personnel-mgmt/${id}/personnel/${employeeId}/remove`, data || {})
      if (res?.success) {
        success(t('common.success'))
        loadProjectData()
      }
    } catch (err: any) {
      showError(err.message || t('common.error'))
    }
  }

  return {
    // 数据
    project, phases, tasks, milestones, personnel, assets, knowledge,
    currentUser, isAdmin, loading,
    // 编辑
    isEditing, editForm, setEditForm,
    handleEdit, handleCancelEdit, handleSave, handleDelete,
    // 里程碑
    setMilestones,
    // 工作流
    workflowInstance, workflowTasks, workflowLogs, currentTask,
    workflowLoading, loadWorkflowData,
    handleApproveAction, handleWithdraw,
    // 刷新
    loadProjectData,
    loadExtensionData,
    updatePersonnelPermission,
    addPersonnel,
    transferPersonnel,
    removePersonnel,
    // 支出
    expenses,
    addExpense: async (data: any) => {
      const res = await apiClient.post<any>(`/api/projects/extensions/${id}/expenses`, data)
      if (res?.success) {
        setExpenses(prev => [res.data, ...prev])
        success(t('common.success'))
      }
    },
    deleteExpense: async (expId: string) => {
      const res = await apiClient.delete<any>(`/api/projects/extensions/expenses/${expId}`)
      if (res?.success) {
        setExpenses(prev => prev.filter(e => e.id !== expId))
        success(t('common.success'))
      }
    },
    // 风险
    risks,
    addRisk: async (data: any) => {
      const res = await apiClient.post<any>(`/api/projects/extensions/${id}/risks`, data)
      if (res?.success) {
        setRisks(prev => [res.data, ...prev])
        success(t('common.success'))
      }
    },
    updateRisk: async (riskId: string, data: any) => {
      const res = await apiClient.put<any>(`/api/projects/extensions/risks/${riskId}`, data)
      if (res?.success) {
        setRisks(prev => prev.map(r => r.id === riskId ? res.data : r))
        success(t('common.success'))
      }
    },
    deleteRisk: async (riskId: string) => {
      const res = await apiClient.delete<any>(`/api/projects/extensions/risks/${riskId}`)
      if (res?.success) {
        setRisks(prev => prev.filter(r => r.id !== riskId))
        success(t('common.success'))
      }
    },
    // 人员计划
    staffingPlans,
    addStaffingPlan: async (data: any) => {
      const res = await apiClient.post<any>(`/api/projects/extensions/${id}/staffing-plans`, data)
      if (res?.success) {
        setStaffingPlans(prev => [...prev, res.data])
        success(t('common.success'))
      }
    },
    deleteStaffingPlan: async (planId: string) => {
      const res = await apiClient.delete<any>(`/api/projects/extensions/staffing-plans/${planId}`)
      if (res?.success) {
        setStaffingPlans(prev => prev.filter(p => p.id !== planId))
        success(t('common.success'))
      }
    },
  }
}
