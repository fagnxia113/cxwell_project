import React, { useMemo } from 'react'
import { 
  User, Calendar, Type, Hash, FileText, Mail, Phone, 
  Layers, Package, Archive, Info, Search, X, CheckCircle,
  Briefcase, Upload, DollarSign, GraduationCap, Building
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../utils/cn'
import { useTranslation } from 'react-i18next'
import { useDynamicOptions } from '../../hooks/useDynamicOptions'
import { projectApi } from '../../api/projectApi'
import { orgApi } from '../../api/orgApi'
import SearchableDropdown from './SearchableDropdown'
import FileUploadField from './FileUploadField'
import SubformField from './SubformField'

interface FormField {
  name: string
  label: string
  type: string
  required?: boolean
  placeholder?: string
  options?: { label: string; value: any }[]
  dynamicOptions?: string
  dataSource?: string
  layout?: { width?: 'half' | 'full' }
  readonly?: boolean
  disabled?: boolean
  defaultValue?: any
  group?: string
  rows?: number
  min?: number
  multi?: boolean
  columns?: any[]
}

interface FormTemplateRendererProps {
  fields: FormField[]
  data?: Record<string, any>
  onFieldChange: (name: string, value: any) => void
  mode?: 'create' | 'edit' | 'view'
  editableFields?: string[]
  userMap?: Record<string, string>
  departmentMap?: Record<string, string>
  warehouseMap?: Record<string, string>
  projectMap?: Record<string, string>
  positionMap?: Record<string, string>
  customerMap?: Record<string, string>
  repairOrder?: any
}

const baseInputClass = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 text-sm font-medium transition-all duration-300 focus:ring-4 focus:ring-primary/10 focus:border-primary hover:border-slate-300 placeholder:text-slate-300 shadow-sm"
const readonlyInputClass = "w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-600 text-sm font-semibold italic shadow-inner select-none cursor-default"
const labelClass = "flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1"

const GROUP_KEY_MAP: Record<string, string> = {
  '基本信息': 'basic_info',
  '商务信息': 'business_info',
  '业务详情': 'business_info',
  '项目信息': 'project_info',
  '管理信息': 'project_info',
  '规模信息': 'project_scale',
  '项目规模': 'project_scale',
  '技术架构': 'tech_arch',
  '阶段规划': 'phase_plan',
  '职位信息': 'job_info',
  '入职岗位信息': 'job_info',
  '岗位信息': 'job_info',
  '教育信息': 'education_info',
  '申请详情': 'basic_info',
  '金额详情': 'business_info',
  '报销明细': 'business_info',
  '调动信息': 'transfer_info',
  '请假信息': 'leave_info',
  '学历与教育': 'education_info',
  '补充材料': 'other_info',
  '其他信息': 'other_info',
  '其他': 'other_info'
}

const GROUP_ICONS: Record<string, any> = {
  'basic_info': Info,
  'business_info': DollarSign,
  'project_info': Archive,
  'project_scale': Layers,
  'tech_arch': Package,
  'phase_plan': Calendar,
  'job_info': Briefcase,
  'transfer_info': User,
  'leave_info': Calendar,
  'education_info': GraduationCap,
  'other_info': Info,
  'expense_items': Package
}

const FormTemplateRenderer: React.FC<FormTemplateRendererProps> = ({
  fields,
  data = {},
  onFieldChange,
  mode = 'create',
  editableFields = []
}) => {
  const { t } = useTranslation()
  const isReadonly = mode === 'view'
  const { optionsMap, fetchOptions } = useDynamicOptions()

  // 预加载动态选项
  React.useEffect(() => {
    fields.forEach(f => {
      const fetchKey = f.dataSource || f.dynamicOptions
      if (fetchKey) {
        fetchOptions(fetchKey)
      } else if (['user', 'employee', 'department', 'project', 'customer', 'position'].includes(f.type)) {
        fetchOptions(f.type)
      }
      // 如果是子表单，也要预加载子表单字段的选项
      if (f.type === 'subform' && f.columns) {
        f.columns.forEach((col: any) => {
          if (['user', 'department', 'project', 'customer', 'position'].includes(col.type)) {
            fetchOptions(col.type)
          }
        })
      }
    })
  }, [fields, fetchOptions])

  // 特殊逻辑：如果是报销明细，自动计算总金额
  React.useEffect(() => {
    const items = data['items']
    if (Array.isArray(items) && fields.some(f => f.name === 'amount' && f.readonly)) {
      const total = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
      if (data['amount'] !== total) {
        onFieldChange('amount', total)
      }
    }
  }, [data['items'], fields, onFieldChange, data['amount']])

  const renderFieldInput = (field: FormField) => {
    const val = data[field.name] ?? ''
    const fieldLabel = t(`workflow.form.field.${field.name}`, { defaultValue: field.label })
    const fieldPlaceholder = field.placeholder 
      ? (field.placeholder.includes('.') ? t(field.placeholder) : field.placeholder)
      : (['select', 'user', 'department', 'position', 'customer', 'project'].includes(field.type) ? t('common.select') : t('common.inputPlaceholder'))

    const isForceEditable = editableFields.includes(field.name)

    if (!isForceEditable && (isReadonly || field.readonly || field.disabled) && field.type !== 'subform' && field.type !== 'file') {
      const getDisplayValue = () => {
        if (field.options) {
          const opt = field.options.find(o => o.value === val)
          const displayLabel = opt ? opt.label : val
          return t(displayLabel, { defaultValue: displayLabel })
        }
        const dynamicType = field.dataSource || field.dynamicOptions || field.type
        const currentOptions = optionsMap[dynamicType]
        if (currentOptions) {
          const opt = currentOptions.find(o => String(o.value) === String(val))
          const displayLabel = opt ? opt.label : val
          return t(displayLabel, { defaultValue: displayLabel })
        }
        
        if (typeof val === 'object' && val !== null) return JSON.stringify(val)
        return (val === 0 || val) ? val : '-'
      }
      return <div className={readonlyInputClass}>{getDisplayValue()}</div>
    }

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={val}
            onChange={(e) => onFieldChange(field.name, e.target.value)}
            className={cn(baseInputClass, "resize-none")}
            placeholder={fieldPlaceholder}
            rows={field.rows || 3}
          />
        )
      case 'select':
      case 'user':
      case 'employee':
      case 'department':
      case 'project':
      case 'customer':
      case 'position':
        const currentOptions = field.options || optionsMap[field.dataSource || field.dynamicOptions || field.type] || []
        return (
          <SearchableDropdown
            label={fieldLabel}
            value={val}
            options={currentOptions}
            onChange={async (v) => {
              onFieldChange(field.name, v)

              if ((field as any).multi === true) return

              // Auto-population logic for projects
              if (field.type === 'project' && v) {
                try {
                  const res = await projectApi.getProjectDetail(v)
                  if (res?.success && res?.data) {
                    const p = res.data
                    const mappings: Record<string, any> = {
                      'project_name': p.projectName || p.name,
                      'project_code': p.projectCode || p.code,
                      'manager_name': p.manager || p.manager_name || p._managerName,
                      'start_date': (p.startDate || p.start_date)?.split('T')[0],
                      'budget': p.budget,
                      'actual_expense': p.actual_expense
                    }
                    Object.entries(mappings).forEach(([targetName, targetValue]) => {
                      if (targetValue !== undefined && targetValue !== null) {
                        // Check if field exists in form schema
                        if (fields.some(f => f.name === targetName)) {
                          onFieldChange(targetName, targetValue)
                        }
                      }
                    })
                  }
                } catch (e) {
                  console.error('Failed to auto-populate project data:', e)
                }
              }

              // Auto-population logic for employees
              if ((field.type === 'employee' || field.dynamicOptions === 'employee') && v) {
                try {
                  const res = await orgApi.getEmployeeById(v)
                  if (res?.success && res?.data) {
                    const emp = res.data
                    const mappings: Record<string, any> = {
                      'employeeName': emp.name,
                      'name': emp.name,
                      'employeeNo': emp.employeeNo,
                      'employee_no': emp.employeeNo,
                      'deptId': emp.deptId,
                      'department': emp.deptId,
                      'position': emp.position,
                      'post': emp.position
                    }
                    Object.entries(mappings).forEach(([targetName, targetValue]) => {
                      if (targetValue !== undefined && targetValue !== null) {
                        if (fields.some(f => f.name === targetName)) {
                          onFieldChange(targetName, targetValue)
                        }
                      }
                    })
                  }
                } catch (e) {
                  console.error('Failed to auto-populate employee data:', e)
                }
              }
            }}
            placeholder={fieldPlaceholder}
            multi={field.type === 'employee' && (field as any).multi === true}
          />
        )
      case 'date':
        return (
          <input
            type="date"
            value={val}
            onChange={(e) => onFieldChange(field.name, e.target.value)}
            className={baseInputClass}
          />
        )
      case 'file':
        return (
          <FileUploadField
            value={val}
            onChange={(v) => onFieldChange(field.name, v)}
            readonly={!isForceEditable && (isReadonly || field.readonly || field.disabled)}
          />
        )
      case 'subform':
        return (
          <SubformField
            value={val || []}
            onChange={(v) => onFieldChange(field.name, v)}
            columns={(field as any).columns || []}
            readonly={!isForceEditable && (isReadonly || field.readonly || field.disabled)}
            optionsMap={optionsMap}
          />
        )
      default:
        return (
          <input
            type={field.type === 'number' ? 'number' : 'text'}
            value={val}
            onChange={(e) => onFieldChange(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
            className={baseInputClass}
            placeholder={fieldPlaceholder}
          />
        )
    }
  }

  const fieldWrapper = (field: FormField, children: React.ReactNode) => {
    const iconMap: any = {
      user: User, date: Calendar, number: Hash, 
      text: Type, email: Mail, phone: Phone, textarea: FileText,
      select: Layers, department: Package, project: Archive, customer: User,
      employee: User, position: Briefcase, file: Upload
    }
    const Icon = iconMap[field.type] || Info
    const isFullWidth = field.layout?.width === 'full' || field.type === 'textarea' || field.type === 'file' || field.type === 'subform'
    const fieldLabel = t(`workflow.form.field.${field.name}`, { defaultValue: field.label })

    return (
      <motion.div 
        key={field.name} 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("group/field", isFullWidth ? 'col-span-full' : 'sm:col-span-1')}
      >
        <label className={labelClass}>
          <div className="p-1.5 bg-slate-50 rounded-lg group-hover/field:bg-primary/5 transition-colors">
            <Icon size={12} className="text-slate-400 group-hover/field:text-primary transition-colors" />
          </div>
          <span>{fieldLabel}</span>
          {field.required && <span className="text-rose-500 font-bold ml-1">*</span>}
        </label>
        {children}
      </motion.div>
    )
  }

  const hasGroups = fields.some(f => f.group)

  const groupedFields = useMemo(() => {
    if (!hasGroups) return [{ group: '', fields }]
    const map = new Map<string, FormField[]>()
    fields.forEach(f => {
      const g = f.group || ''
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(f)
    })
    return Array.from(map.entries()).map(([group, fields]) => ({ group, fields }))
  }, [fields, hasGroups])

  return (
    <div className="space-y-6">
      {groupedFields.map(({ group, fields: groupFields }) => {
        const groupKey = GROUP_KEY_MAP[group] || group
        const GroupIcon = GROUP_ICONS[group] || GROUP_ICONS[groupKey] || Info
        const groupLabel = t(`workflow.form.group.${groupKey}`, { defaultValue: group })

        return (
          <div key={group || 'default'}>
            {hasGroups && group && (
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                <div className="p-1 bg-indigo-50 rounded-lg">
                  <GroupIcon size={12} className="text-indigo-500" />
                </div>
                <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">{groupLabel}</h4>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              <AnimatePresence mode="popLayout">
                {groupFields.map(field => fieldWrapper(field, renderFieldInput(field)))}
              </AnimatePresence>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default FormTemplateRenderer