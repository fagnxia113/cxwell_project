import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { projectApi } from '../api/projectApi'
import { useMessage } from './useMessage'
import { useConfirm } from './useConfirm'
import { apiClient } from '../utils/apiClient'
import { workflowApi } from '../services/workflowApi'
import { 
  Project, Phase, Task, Milestone, ProjectPersonnel, 
  ProjectAsset, KnowledgeItem, ProjectExpense, ProjectRisk, 
  ProjectStaffingPlan, UserInfo, WorkflowInstance, 
  WorkflowTask, WorkflowLog 
} from '../types/project'

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
  const [usedManDays, setUsedManDays] = useState(0)

  // ---- 用户角色状态 ----
  const [isProjectManager, setIsProjectManager] = useState(false)
  const [isProjectMember, setIsProjectMember] = useState(false)

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

      // 使用新的后端聚合接口 (优化点: 1次请求获取核心业务数据)
      const res = await projectApi.getProjectDetail(id)
      
      if (res && res.success) {
        const data = res.data
        setProject(data)
        setEditForm(data)

        // 设置用户角色信息 (由后端计算)
        setIsProjectManager(data.isProjectManager === true)
        setIsProjectMember(data.isProjectMember === true)

        // 映射人员 (后端 members -> 前端 personnel)
        const mappedPersonnel: ProjectPersonnel[] = (data.members || []).map((m: any) => ({
          id: m.id,
          employee_id: m.employeeId,
          employee_name: m.employee?.name || t('common.unknown'),
          role: m.roleName || t('common.member'),
          can_edit: m.can_edit === 1,
          join_date: m.joinDate
        }))
        setPersonnel(mappedPersonnel)

        // 映射任务 (WBS)
        const mappedTasks: Task[] = (data.tasks || []).map((t: any) => ({
          ...t,
          id: t.taskId,
          name: t.taskName,
          assignee: t.assigneeId // 简单映射
        }))
        setTasks(mappedTasks)

        // 映射里程碑
        const mapMilestone = (milestone: any): Milestone => ({
          id: milestone.id,
          project_id: milestone.projectId,
          parent_id: milestone.parentId,
          name: milestone.name,
          description: milestone.description || null,
          planned_start_date: milestone.plannedStartDate || milestone.plannedDate || '',
          planned_end_date: milestone.plannedEndDate || milestone.plannedDate || '',
          actual_end_date: milestone.actualDate || null,
          weight: milestone.weight || 0,
          progress: milestone.progress || 0,
          status: milestone.status === '1' ? 'completed' : (milestone.status === '2' ? 'in_progress' : 'pending'),
          resources: milestone.resources || [],
          children: milestone.children?.map((child: any) => mapMilestone(child))
        })
        const mappedMilestones: Milestone[] = (data.milestones || [])
          .filter((m: any) => m.parentId === null || m.parentId === undefined || String(m.parentId) === '0' || String(m.parentId) === '')
          .map(mapMilestone)
        setMilestones(mappedMilestones)

        // 映射阶段 (用于侧边栏进度视图)
        const mappedPhases: Phase[] = mappedMilestones.map(m => ({
          id: m.id,
          phase_name: m.name,
          status: m.status,
          planned_start_date: m.plannedDate,
          planned_end_date: m.plannedDate,
          actual_start_date: '',
          actual_end_date: m.actualDate || '',
          progress: m.status === '2' ? 100 : 0,
          warning_level: 'normal',
          manager: t('common.noData'),
        }))
        setPhases(mappedPhases)
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
      const now = new Date()
      const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

      const [expensesRes, risksRes, staffingRes, manDaysRes] = await Promise.allSettled([
        apiClient.get<any>(`/api/project/extension/${id}/expenses`),
        apiClient.get<any>(`/api/project/extension/${id}/risks`),
        apiClient.get<any>(`/api/project/extension/${id}/staffing-plans`),
        apiClient.get<any>(`/api/attendance/project/${id}/man-days?year_month=${yearMonth}`)
      ])

      if (expensesRes.status === 'fulfilled') setExpenses(expensesRes.value?.data || [])
      if (risksRes.status === 'fulfilled') {
        const allRisks = risksRes.value?.data || []
        setRisks(allRisks)
      }
      if (staffingRes.status === 'fulfilled') setStaffingPlans(staffingRes.value?.data || [])
      if (manDaysRes.status === 'fulfilled') {
        setUsedManDays(manDaysRes.value?.data?.usedManDays || 0)
      }
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
      const result = await apiClient.put<any>(`/api/project/${id}`, editForm)
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
      const result = await apiClient.delete<any>(`/api/project/${id}`)
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
      const res = await workflowApi.getInstanceByBusinessId(id)
      if (res && res.success && res.data) {
        setWorkflowInstance(res.data)

        // 加载当前实例的轨迹与日志
        const logRes = await workflowApi.getTrajectory(res.data.id)
        if (logRes && logRes.success) {
          setWorkflowLogs(logRes.data || [])
        }

        // 查找当前用户的待办任务
        const pendingRes = await workflowApi.getPendingTasks()
        if (pendingRes && pendingRes.success) {
          // 查找匹配当前业务实例的任务
          const activeTask = (pendingRes.data || []).find(
            (t: any) => t.instanceId.toString() === res.data.id.toString()
          )
          setCurrentTask(activeTask || null)
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
    try {
      const result = await workflowApi.approveTask(currentTask.id.toString(), {
        message: comment,
        skipType: actionType === 'approve' ? 'PASS' : 'REJECT'
      })
      if (result?.success) {
        success(t('common.success'))
        loadWorkflowData()
        return true
      } else {
        showError(result?.message || t('common.error'))
        return false
      }
    } catch (error: any) {
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
      const result = await workflowApi.withdrawInstance(workflowInstance.id.toString())
      if (result?.success) {
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
      const result = await apiClient.put<any>(`/api/project/extension/${id}/personnel/${employeeId}/permission`, { canEdit })
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
      const res = await apiClient.post<any>(`/api/project/personnel-mgmt/${id}/personnel/add`, data)
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
      const res = await apiClient.post<any>(`/api/project/personnel-mgmt/${id}/personnel/transfer`, data)
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

      const res = await apiClient.post<any>(`/api/project/personnel-mgmt/${id}/personnel/${employeeId}/remove`, data || {})
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
    currentUser, isAdmin, isProjectManager, isProjectMember, loading, usedManDays,
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
      const res = await apiClient.post<any>(`/api/project/extension/${id}/expenses`, data)
      if (res?.success) {
        setExpenses(prev => [res.data, ...prev])
        success(t('common.success'))
      }
    },
    deleteExpense: async (expId: string) => {
      const res = await apiClient.delete<any>(`/api/project/extension/expenses/${expId}`)
      if (res?.success) {
        setExpenses(prev => prev.filter(e => e.id !== expId))
        success(t('common.success'))
      }
    },
    // 风险
    risks,
    addRisk: async (data: any) => {
      const res = await apiClient.post<any>(`/api/project/extension/${id}/risks`, data)
      if (res?.success) {
        setRisks(prev => [res.data, ...prev])
        success(t('common.success'))
      }
    },
    updateRisk: async (riskId: string, data: any) => {
      const res = await apiClient.put<any>(`/api/project/extension/risks/${riskId}`, data)
      if (res?.success) {
        setRisks(prev => prev.map(r => r.id === riskId ? res.data : r))
        success(t('common.success'))
      }
    },
    deleteRisk: async (riskId: string) => {
      const res = await apiClient.delete<any>(`/api/project/extension/risks/${riskId}`)
      if (res?.success) {
        setRisks(prev => prev.filter(r => r.id !== riskId))
        success(t('common.success'))
      }
    },
    // 人员计划
    staffingPlans,
    addStaffingPlan: async (data: any) => {
      const res = await apiClient.post<any>(`/api/project/extension/${id}/staffing-plans`, data)
      if (res?.success) {
        setStaffingPlans(prev => [...prev, res.data])
        success(t('common.success'))
      }
    },
    deleteStaffingPlan: async (planId: string) => {
      const res = await apiClient.delete<any>(`/api/project/extension/staffing-plans/${planId}`)
      if (res?.success) {
        setStaffingPlans(prev => prev.filter(p => p.id !== planId))
        success(t('common.success'))
      }
    },
  }
}
