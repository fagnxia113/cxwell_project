import React from 'react'
import { FileText, Calendar, User, Zap, Database, Maximize } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ProcessInstance, FormField } from '../../hooks/useProcessInstance'
import EquipmentTransferForm from '../equipment/EquipmentTransferForm'

interface ProcessFormViewerProps {
  instance: ProcessInstance
  formFields: FormField[]
  dynamicOptions: Record<string, { label: string; value: any }[]>
  currentUser: any
  onReload: () => void
}

export default function ProcessFormViewer({ instance, formFields, dynamicOptions, currentUser, onReload }: ProcessFormViewerProps) {
  const { t } = useTranslation()

  // 业务分组配置
  const FORM_GROUP_CONFIG: Record<string, { title: string; fields: string[]; icon?: any }[]> = {
    'project-approval': [
      { title: t('workflow.form_groups.basic_info'), fields: ['projectCode', 'projectName', 'projectType', 'status'], icon: FileText },
      { title: t('workflow.form_groups.project_info'), fields: ['country', 'province', 'city', 'address', 'startDate', 'endDate'], icon: Calendar },
      { title: t('workflow.form_groups.project_manager'), fields: ['managerId', 'technicalLeadId'], icon: User },
      { title: t('workflow.form_groups.project_scale'), fields: ['buildingArea', 'itCapacity', 'cabinetCount', 'cabinetPower'], icon: Zap },
      { title: t('workflow.form_groups.technical_arch'), fields: ['powerArchitecture', 'hvacArchitecture', 'fireArchitecture', 'weakElectricArchitecture'], icon: Database },
      { title: t('workflow.form_groups.business_info'), fields: ['customerId', 'endCustomer', 'budget', 'description'], icon: FileText }
    ],
    'employee-onboard': [
      { title: t('workflow.form_groups.basic_info'), fields: ['employeeName', 'gender', 'countryCode', 'phone', 'email'], icon: User },
      { title: t('workflow.form_groups.job_info'), fields: ['departmentId', 'position', 'entryDate'], icon: FileText },
      { title: t('workflow.form_groups.other_info'), fields: ['education', 'graduationSchool'], icon: FileText }
    ],
    'leave-approval': [
      { title: t('workflow.form_groups.basic_info'), fields: ['employeeName', 'leaveType'], icon: User },
      { title: t('workflow.form_groups.leave_info'), fields: ['startDate', 'endDate', 'days', 'reason'], icon: Calendar }
    ],
    'expense-reimbursement': [
      { title: t('workflow.form_groups.basic_info'), fields: ['projectId', 'category'], icon: FileText },
      { title: t('workflow.form_groups.expense_info'), fields: ['amount', 'expenseDate', 'reason'], icon: Zap },
      { title: t('workflow.form_groups.expense_items'), fields: ['items'], icon: Database }
    ],
    'equipment-transfer': [
      { title: t('workflow.form_groups.transfer_info'), fields: ['fromLocationType', 'toLocationType', 'transferReason', 'estimatedArrivalDate'], icon: FileText },
      { title: t('workflow.form_groups.out_location'), fields: ['_fromLocationName', '_fromManagerName'], icon: FileText },
      { title: t('workflow.form_groups.in_location'), fields: ['_toLocationName', '_toManagerName'], icon: FileText },
      { title: t('workflow.form_groups.transfer_items'), fields: ['items'], icon: FileText },
      { title: t('workflow.form_groups.shipping_info'), fields: ['shippingDate', 'shipping_no', 'shippingNotes'], icon: FileText },
      { title: t('workflow.form_groups.receiving_info'), fields: ['receiveStatus', 'receiveComment'], icon: FileText }
    ],
    'default': [
      { title: t('workflow.form_groups.form_content'), fields: [], icon: FileText }
    ]
  }

  const getDisplayValue = (fieldName: string, value: any): React.ReactNode => {
    if (value === null || value === undefined || value === '') return '-'
    if (fieldName === 'gender' && value === 'unknown') return '-'

    const options = dynamicOptions[fieldName]
    if (options) {
      const option = options.find(o => o.value === value || o.value === String(value))
      if (option) return option.label
    }

    if (fieldName.includes('department') && typeof value === 'string') {
      const dept = (dynamicOptions['department_id'] || []).find(o => o.value === value || o.value === String(value))
      if (dept) return dept.label
    }

    if (fieldName.includes('position') && typeof value === 'string') {
      const pos = (dynamicOptions['position_id'] || []).find(o => o.value === value || o.value === String(value))
      if (pos) return pos.label
    }

    if (typeof value === 'boolean') return value ? t('common.yes') : t('common.no')

    const field = formFields.find(f => f.name === fieldName)
    if (field?.type === 'date' || fieldName.includes('date') || fieldName.includes('time')) {
      try { return new Date(value).toISOString().split('T')[0] } catch { return value }
    }

    if (Array.isArray(value)) {
      if (fieldName === 'items') {
        return (
          <div className="space-y-2 w-full mt-1">
            {value.map((item: any, i: number) => (
              <div key={i} className="text-sm bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex justify-between items-center group hover:border-blue-200 transition-all">
                <div>
                  <div className="font-bold text-gray-900">{item.equipment_name || item.name}</div>
                  <div className="text-gray-500 text-xs mt-0.5">
                    {t('equipment.fields.model')}: {item.model_no || '-'} | {t('equipment.fields.category')}: {item.category || '-'}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-blue-600 text-lg">{item.quantity}</span> <span className="text-xs text-gray-400">{item.unit || t('equipment.fields.unit')}</span>
                </div>
              </div>
            ))}
          </div>
        )
      }
      
      // 报销明细渲染
      if (fieldName === 'items' && value.length > 0 && (value[0].category || value[0].amount)) {
        return (
          <div className="w-full mt-2 overflow-x-auto rounded-xl border border-slate-100 shadow-sm">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">类别</th>
                  <th className="px-4 py-2 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">项目</th>
                  <th className="px-4 py-2 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">金额</th>
                  <th className="px-4 py-2 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">事由</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {value.map((item: any, i: number) => (
                  <tr key={i} className="text-xs">
                    <td className="px-4 py-2 font-bold text-slate-700">{item.category}</td>
                    <td className="px-4 py-2 text-slate-500">
                      {(dynamicOptions['project'] || []).find(o => String(o.value) === String(item.project_id))?.label || item.project_id || '-'}
                    </td>
                    <td className="px-4 py-2 font-black text-blue-600">¥{Number(item.amount).toLocaleString()}</td>
                    <td className="px-4 py-2 text-slate-500 italic">{item.item_reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
      return JSON.stringify(value)
    }

    return String(value)
  }

  const getFormGroups = () => {
    const definitionKey = instance?.definition_key || ''
    const config = FORM_GROUP_CONFIG[definitionKey] || FORM_GROUP_CONFIG['default']
    const formData = instance?.variables?.formData || {}

    return config.map((group) => {
      let fields: string[]
      if (group.fields.length === 0) {
        fields = Object.keys(formData).filter((f: string) => !f.startsWith('_'))
      } else {
        fields = group.fields.filter((f: string) => formData.hasOwnProperty(f))
      }
      return { title: group.title, fields, icon: group.icon || FileText }
    }).filter((g) => g.fields.length > 0)
  }

  const isEquipmentTransfer = instance?.definition_key === 'equipment-transfer' || instance?.definition_key === 'preset-equipment-transfer'
  const hasBusinessId = instance?.business_id || instance?.variables?.formData?.transferOrderId

  if (isEquipmentTransfer && hasBusinessId) {
    return (
      <EquipmentTransferForm
        transferOrderId={instance?.business_id || instance?.variables?.formData?.transferOrderId}
        currentUser={currentUser}
        onShippingComplete={onReload}
      />
    )
  }

  return (
    <div className="space-y-4">
      {getFormGroups().map((group, idx) => (
        <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <group.icon className="w-5 h-5 text-blue-500" />
              {group.title}
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {group.fields.map((fieldName) => {
                const field = formFields.find(f => f.name === fieldName)
                const value = instance.variables?.formData?.[fieldName]
                
                const labelMap: Record<string, string> = {
                  '_fromLocationName': t('workflow.form_groups.out_location'),
                  '_fromManagerName': t('workflow.form_groups.out_location_manager'),
                  '_toLocationName': t('workflow.form_groups.in_location'),
                  '_toManagerName': t('workflow.form_groups.in_location_manager'),
                  'items': t('workflow.fields.shipping_items')
                }

                return (
                  <div key={fieldName} className={`group ${fieldName === 'items' ? 'md:col-span-2' : ''}`}>
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2 block">
                      {field?.label || labelMap[fieldName] || fieldName}
                    </label>
                    <div className={`px-4 py-3 bg-gray-50/50 rounded-xl border border-gray-100 text-gray-900 text-sm min-h-[46px] transition-colors group-hover:bg-white group-hover:border-blue-100 ${fieldName === 'items' ? '' : 'flex items-center font-medium'}`}>
                      {getDisplayValue(fieldName, value)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
