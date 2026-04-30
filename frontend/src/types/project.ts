// ============================================================
// 📦 项目模块所有类型定义（从 ProjectDetailPage 中抽离）
// 精简点：原来散落在 2144 行页面文件顶部的 13 个接口，
//         现在集中到一个文件，全局可复用
// ============================================================

// ---------- 核心实体 ----------

export interface Project {
  id: string
  code: string
  name: string
  status: string
  progress: number
  start_date: string
  end_date: string
  manager: string
  manager_id?: string
  tech_manager: string
  country: string
  address: string
  description: string
  budget: number
  customer_name: string
  customerId?: string
  building_area?: number
  it_capacity?: number
  cabinet_count?: number
  cabinet_power?: number
  rack_power?: number          // 原文件中 editForm/display 用到但接口未声明
  power_architecture?: string
  hvac_architecture?: string
  fire_architecture?: string
  weak_electric_architecture?: string
  technical_lead_id?: string
  end_customer?: string
}

export interface Phase {
  id: string
  phase_name: string
  status: string
  planned_start_date: string
  planned_end_date: string
  actual_start_date: string
  actual_end_date: string
  progress: number
  warning_level: string
  manager: string
}

export interface MilestoneResource {
  id: string
  milestone_id: string
  resource_name: string
  required_count: number
  collected_count: number
  notes: string | null
  status: 'complete' | 'incomplete'
}

export interface Milestone {
  id: string
  project_id: string
  parent_id: string | null
  name: string
  description: string | null
  planned_start_date: string
  planned_end_date: string
  actual_end_date: string | null
  weight: number
  progress: number
  status: 'pending' | 'in_progress' | 'completed'
  resources: MilestoneResource[]
  children?: Milestone[]
  level?: number
}

export interface Task {
  id: string
  code: string
  name: string
  status: string
  progress: number
  planned_start_date: string
  planned_end_date: string
  assignee: string
  wbs_code: string
  task_type: string
  parent_id: string | null
}

export interface ProjectPersonnel {
  id: string
  employee_id: string
  employee_name: string
  department: string
  position: string
  on_duty_status: string
  transfer_in_date: string
  transfer_out_date: string | null
  notes: string
  visa_expiry?: string
  planning_status?: 'on_site' | 'leave' | 'visa_renewal'
  attendance_rate?: number
  can_edit?: boolean
}

export interface ProjectReport {
  id: string
  name: string
  status: string
  submit_date: string
  responsible_person: string
  progress: number
}

export interface ProjectRisk {
  id: string
  risk_no?: string
  title: string
  description: string
  category?: string
  milestone_id?: string
  level: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'in_progress' | 'pending_review' | 'closed'
  owner_id?: string
  owner_name?: string
  progress_note?: string
  deadline?: string
  closed_at?: string
  create_time: string
  update_time: string
}

export interface ProjectExpense {
  id: string
  project_id: string
  category: string
  amount: number
  date: string
  notes: string
}

export interface ProjectStaffingPlan {
  id: string
  project_id: string
  employee_id: string
  employee_name?: string
  plan_type: 'rotation' | 'leave'
  start_date: string
  end_date: string
  notes: string
}

export interface ProjectAsset {
  id: string
  name: string
  code: string
  category: string
  keeper: string
  status: 'in_use' | 'requested' | 'maintenance'
}

export interface KnowledgeItem {
  id: string
  title: string
  type: 'SOP' | 'Video' | 'Document'
  author: string
  date: string
  is_mandatory: boolean
}

export interface UserInfo {
  id: string
  role: string
}

// ---------- 工作流相关 ----------

export interface WorkflowInstance {
  id: string
  definition_id: string
  definition_key: string
  title: string
  status: string
  result: string | null
  initiator_id: string
  initiator_name: string
  start_time: string
  end_time: string | null
  current_node_id: string | null
  current_node_name: string | null
  business_id: string | null
}

export interface WorkflowTask {
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

export interface WorkflowLog {
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

// ---------- 状态映射表 ----------
// 精简点：原来是 3 个函数每次调用都重建对象，
//         现在用工厂函数 + 类型，只在需要时生成

export type StatusStyle = { label: string; bg: string; text: string }
export type PhaseStatusStyle = { label: string; color: string }

export const getStatusLabels = (t: (key: string) => string): Record<string, StatusStyle> => ({
  proposal:    { label: t('project.status.proposal'),    bg: 'bg-slate-100',   text: 'text-slate-600' },
  initiated:   { label: t('project.status.initiated'),   bg: 'bg-indigo-50',   text: 'text-indigo-600' },
  in_progress: { label: t('project.status.in_progress'), bg: 'bg-blue-50',     text: 'text-blue-600' },
  completed:   { label: t('project.status.completed'),   bg: 'bg-emerald-50',  text: 'text-emerald-600' },
  paused:      { label: t('project.status.paused'),      bg: 'bg-amber-50',    text: 'text-amber-600' },
  delayed:     { label: t('project.status.delayed'),     bg: 'bg-rose-50',     text: 'text-rose-600' },
})

export const getPhaseStatusLabels = (t: (key: string) => string): Record<string, PhaseStatusStyle> => ({
  not_started: { label: t('common.noData'),             color: 'slate' },
  in_progress: { label: t('project.status.in_progress'), color: 'blue' },
  completed:   { label: t('project.status.completed'),   color: 'emerald' },
  paused:      { label: t('project.status.paused'),      color: 'amber' },
})

export const getWarningLabels = (t: (key: string) => string): Record<string, PhaseStatusStyle> => ({
  normal:  { label: t('common.normal'),  color: 'emerald' },
  warning: { label: t('common.warning'), color: 'amber' },
  severe:  { label: t('common.severe'),  color: 'rose' },
})

// ---------- 通用工具 ----------

/** 格式化日期为 YYYY-MM-DD，空值返回 '-' */
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '-'
  return date.toISOString().split('T')[0]
}
