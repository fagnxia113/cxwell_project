import i18n from '../i18n'
import {
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  ChevronDown
} from 'lucide-react'

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
  variables: string | {
    formData: Record<string, any>
    [key: string]: any
  }
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

export const getStatusConfig = (t: any): Record<string, { label: string; color: string; bgColor: string; icon: any }> => ({
  'pending': { label: t('workflow.status.pending'), color: 'text-amber-700', bgColor: 'bg-amber-50', icon: Clock },
  'running': { label: t('workflow.status.pending'), color: 'text-amber-700', bgColor: 'bg-amber-50', icon: Clock },
  'approved': { label: t('workflow.status.approved'), color: 'text-emerald-700', bgColor: 'bg-emerald-50', icon: CheckCircle },
  'rejected': { label: t('workflow.status.rejected'), color: 'text-rose-700', bgColor: 'bg-rose-50', icon: XCircle },
  'withdrawn': { label: t('workflow.status.withdrawn'), color: 'text-slate-700', bgColor: 'bg-slate-50', icon: RotateCcw },
  'completed': { label: t('workflow.status.completed'), color: 'text-emerald-700', bgColor: 'bg-emerald-50', icon: CheckCircle },
  'terminated': { label: t('workflow.status.terminated'), color: 'text-rose-700', bgColor: 'bg-rose-50', icon: XCircle },
  'skipped': { label: t('workflow.status.skipped'), color: 'text-slate-700', bgColor: 'bg-slate-50', icon: ChevronDown }
})

export const getProcessTypeLabels = (t: any): Record<string, string> => ({
  'person_onboard': t('workflow.definitions.personnel_onboard'),
  'personnel_onboard': t('workflow.definitions.personnel_onboard'),
  'personnel_offboard': t('workflow.definitions.personnel_offboard'),
  'personnel_transfer': t('workflow.definitions.personnel_transfer'),
  'personnel_leave': t('workflow.definitions.personnel_leave'),
  'personnel_trip': t('workflow.definitions.personnel_trip'),
  'equipment_inbound': t('workflow.definitions.equipment_inbound'),
  'equipment_outbound': t('workflow.definitions.equipment_outbound'),
  'equipment_transfer': t('workflow.definitions.equipment_transfer'),
  'equipment_repair': t('workflow.definitions.equipment_repair'),
  'equipment_scrap': t('workflow.definitions.equipment_scrap'),
  'project_completion': t('workflow.definitions.project_completion'),
  'purchase_request': t('workflow.definitions.purchase_request'),
  'project-approval': t('workflow.definitions.project_approval')
})

export const formatDateTime = (dateStr: string | Date | null | undefined) => {
  if (!dateStr) return '-'
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  if (!date || isNaN(date.getTime())) return '-'
  return date.toLocaleString(i18n.language, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const formatDate = (dateStr: string | Date | null | undefined) => {
  if (!dateStr) return '-'
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  if (!date || isNaN(date.getTime())) return '-'
  return date.toISOString().split('T')[0]
}

export const formatTime = (dateStr: string | Date | null | undefined) => {
  if (!dateStr) return '-'
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  if (!date || isNaN(date.getTime())) return '-'
  return date.toLocaleString(i18n.language, {
    hour: '2-digit',
    minute: '2-digit'
  })
}
