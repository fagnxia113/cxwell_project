import { 
  User, 
  Database, 
  Send, 
  GitBranch, 
  Activity, 
  CheckCircle2, 
  FileText, 
  Clock, 
  XCircle, 
  RotateCcw,
  Plus
} from 'lucide-react';

/**
 * 流程类型配置：图标、颜色、翻译标签
 */
export const getOrderTypeConfigs = (t: any): Record<string, { label: string; color: string; icon: any }> => ({
  'person_onboard': { label: t('workflow.categories.hr'), color: 'blue', icon: User },
  'personnel_onboard': { label: t('workflow.categories.hr'), color: 'blue', icon: User },
  'personnel_offboard': { label: t('workflow.categories.hr'), color: 'rose', icon: User },
  'equipment_inbound': { label: t('workflow.categories.equipment'), color: 'emerald', icon: Database },
  'equipment_outbound': { label: t('workflow.categories.equipment'), color: 'orange', icon: Send },
  'equipment_transfer': { label: t('workflow.categories.equipment'), color: 'indigo', icon: GitBranch },
  'equipment_repair': { label: t('workflow.categories.equipment'), color: 'pink', icon: Activity },
  'equipment_scrap': { label: t('workflow.categories.equipment'), color: 'slate', icon: Database },
  'project_completion': { label: t('workflow.categories.project'), color: 'violet', icon: CheckCircle2 },
  'purchase_request': { label: t('workflow.categories.purchase'), color: 'cyan', icon: FileText },
  'project_approval': { label: t('workflow.categories.project'), color: 'violet', icon: CheckCircle2 }
});

/**
 * 审批状态配置：视觉反馈与语义化标签
 */
export const getStatusConfigs = (t: any): Record<string, { label: string; color: string; bgColor: string; icon: any; glow: string }> => ({
  'pending': { label: t('workflow.status.normal'), color: 'text-amber-500', bgColor: 'bg-amber-50', icon: Clock, glow: 'shadow-amber-500/20' },
  'approved': { label: t('workflow.status.success'), color: 'text-emerald-500', bgColor: 'bg-emerald-50', icon: CheckCircle2, glow: 'shadow-emerald-500/20' },
  'rejected': { label: t('workflow.status.rejected'), color: 'text-rose-500', bgColor: 'bg-rose-50', icon: XCircle, glow: 'shadow-rose-500/20' },
  'withdrawn': { label: t('workflow.status.withdrawn'), color: 'text-slate-400', bgColor: 'bg-slate-50', icon: RotateCcw, glow: 'shadow-slate-500/10' },
  'running': { label: t('workflow.status.normal'), color: 'text-amber-500', bgColor: 'bg-amber-50', icon: Clock, glow: 'shadow-amber-500/20' },
  'completed': { label: t('workflow.status.success'), color: 'text-emerald-500', bgColor: 'bg-emerald-50', icon: CheckCircle2, glow: 'shadow-emerald-500/20' },
  'terminated': { label: t('workflow.status.archived_engine') || 'Terminated', color: 'text-rose-500', bgColor: 'bg-rose-50', icon: XCircle, glow: 'shadow-rose-500/20' }
});

/**
 * 表单字段名称映射
 */
export const getFormFieldLabels = (t: any): Record<string, string> => ({
  'employee_name': t('personnel.fields.name'), 
  'employee_id': t('personnel.fields.employee_no'), 
  'department_id': t('personnel.fields.dept'), 
  'position_id': t('personnel.fields.position'),
  'phone': t('personnel.fields.phone'), 
  'gender': t('personnel.fields.gender'), 
  'start_date': t('personnel.fields.hireDate'), 
  'employee_type': t('personnel.fields.employee_type'),
  'email': t('personnel.fields.email'), 
  'id_card': t('personnel.fields.id_card'), 
  'address': t('personnel.fields.address'), 
  'emergency_contact': t('personnel.fields.emergency_contact'),
  'emergency_phone': t('personnel.fields.emergency_phone'), 
  'education': t('personnel.fields.education'), 
  'major': t('personnel.fields.major'), 
  'graduation_school': t('personnel.fields.graduation_school'),
  'graduation_date': t('personnel.fields.graduation_date'), 
  'bank_account': t('personnel.fields.bank_account'), 
  'bank_name': t('personnel.fields.bank_name'), 
  'remark': t('personnel.fields.remark'),
  'inbound_type': t('equipment.fields.inbound_type'), 
  'warehouse_id': t('equipment.fields.warehouse'), 
  'supplier': t('equipment.fields.supplier'), 
  'purchase_date': t('equipment.fields.purchase_date'),
  'notes': t('personnel.fields.remark'), 
  'fromLocationType': t('equipment.fields.from_location'), 
  'fromLocationId': t('equipment.fields.from_location'), 
  'fromManagerId': t('equipment.fields.from_location'),
  'toLocationType': t('equipment.fields.to_location'), 
  'toLocationId': t('equipment.fields.to_location'), 
  'toManagerId': t('equipment.fields.to_location'),
  'transferReason': t('equipment.fields.transfer_reason'), 
  'estimatedArrivalDate': t('equipment.fields.estimated_arrival'), 
  'shippingDate': t('workflow.fields.shipping_date') || 'Shipping Date',
  'waybillNo': t('workflow.fields.shipping_no'), 
  'shippingNotes': t('workflow.fields.shipping_note'), 
  'receiveStatus': t('workflow.fields.receiving_status') || 'Receiving Status', 
  'receiveComment': t('workflow.fields.receiving_note') || 'Receiving Note'
});

/**
 * 枚举值翻译映射
 */
export const getEnumLabels = (t: any) => ({
  gender: { 'male': t('personnel.gender.male'), 'female': t('personnel.gender.female') },
  employeeType: {
    'regular': t('personnel.employee_type_labels.regular'),
    'probation': t('personnel.employee_type_labels.probation'),
    'intern': t('personnel.employee_type_labels.intern'),
    'contract': t('personnel.employee_type_labels.contract'),
    'part_time': t('personnel.employee_type_labels.part_time')
  },
  inboundType: { 
    'purchase': t('equipment.inbound_type_labels.purchase'), 
    'repair_return': t('equipment.inbound_type_labels.repair_return'), 
    'other': t('equipment.inbound_type_labels.other') 
  },
  category: { 
    'instrument': t('equipment.categories.instrument'), 
    'fake_load': t('equipment.categories.fake_load'), 
    'accessory': t('equipment.categories.accessory') 
  },
  locationType: { 
    'warehouse': t('equipment.location_type_labels.warehouse'), 
    'project': t('equipment.location_type_labels.project') 
  },
  receiveStatus: { 
    'normal': t('equipment.receive_status_labels.normal'), 
    'damaged': t('equipment.receive_status_labels.damaged'), 
    'missing': t('equipment.receive_status_labels.missing'), 
    'partial': t('equipment.receive_status_labels.partial') 
  }
});
