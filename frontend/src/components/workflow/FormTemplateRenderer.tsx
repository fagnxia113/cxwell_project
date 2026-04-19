import React, { useMemo } from 'react'
import { 
  User, Calendar, Type, Hash, FileText, Mail, Phone, 
  Layers, Package, Archive, Info, Search, X, CheckCircle 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../utils/cn'
import { useTranslation } from 'react-i18next'
import { useDynamicOptions } from '../../hooks/useDynamicOptions'

interface FormField {
  name: string
  label: string
  type: string
  required?: boolean
  placeholder?: string
  options?: { label: string; value: any }[]
  dynamicOptions?: string
  layout?: { width?: 'half' | 'full' }
  readonly?: boolean
  disabled?: boolean
  defaultValue?: any
}

interface FormTemplateRendererProps {
  fields: FormField[]
  data?: Record<string, any>
  onFieldChange: (name: string, value: any) => void
  mode?: 'create' | 'edit' | 'view'
}

const baseInputClass = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm font-medium transition-all duration-300 focus:ring-4 focus:ring-primary/10 focus:border-primary hover:border-slate-300 placeholder:text-slate-300 shadow-sm"
const readonlyInputClass = "w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 text-sm font-semibold italic shadow-inner select-none cursor-default"
const labelClass = "flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1"

const FormTemplateRenderer: React.FC<FormTemplateRendererProps> = ({
  fields,
  data = {},
  onFieldChange,
  mode = 'create'
}) => {
  const { t } = useTranslation()
  const isReadonly = mode === 'view'
  const { optionsMap, fetchOptions } = useDynamicOptions()

  // 预加载动态选项
  React.useEffect(() => {
    fields.forEach(f => {
      if (f.dynamicOptions) {
        fetchOptions(f.dynamicOptions)
      } else if (['user', 'department', 'project', 'customer'].includes(f.type)) {
        fetchOptions(f.type)
      }
    })
  }, [fields, fetchOptions])

  const renderFieldInput = (field: FormField) => {
    const val = data[field.name] ?? ''

    if (isReadonly || field.readonly) {
      const getDisplayValue = () => {
        if (field.options) {
          return field.options.find(o => o.value === val)?.label || val
        }
        const dynamicType = field.dynamicOptions || field.type
        const currentOptions = optionsMap[dynamicType]
        if (currentOptions) {
          return currentOptions.find(o => o.value === val)?.label || val
        }
        return val || '-'
      }
      return <div className={readonlyInputClass}>{getDisplayValue()}</div>
    }

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={val}
            onChange={(e) => onFieldChange(field.name, e.target.value)}
            className={cn(baseInputClass, "min-h-[100px] resize-none")}
            placeholder={field.placeholder || t('common.input_placeholder')}
          />
        )
      case 'select':
      case 'user':
      case 'department':
      case 'project':
      case 'customer':
        const currentOptions = field.options || optionsMap[field.dynamicOptions || field.type] || []
        return (
          <select
            value={val}
            onChange={(e) => onFieldChange(field.name, e.target.value)}
            className={baseInputClass}
          >
            <option value="">{t('common.select_placeholder')}</option>
            {currentOptions.map((opt, i) => (
              <option key={i} value={opt.value}>{opt.label}</option>
            ))}
          </select>
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
      case 'number':
        return (
          <input
            type="number"
            value={val}
            onChange={(e) => onFieldChange(field.name, Number(e.target.value))}
            className={baseInputClass}
            placeholder={field.placeholder || '0'}
          />
        )
      default:
        return (
          <input
            type="text"
            value={val}
            onChange={(e) => onFieldChange(field.name, e.target.value)}
            className={baseInputClass}
            placeholder={field.placeholder || t('common.input_placeholder')}
          />
        )
    }
  }

  const fieldWrapper = (field: FormField, children: React.ReactNode) => {
    const iconMap: any = {
      user: User, date: Calendar, number: Hash, 
      text: Type, email: Mail, phone: Phone, textarea: FileText,
      select: Layers, department: Package, project: Archive, customer: User
    }
    const Icon = iconMap[field.type] || Info
    const isFullWidth = field.layout?.width === 'full' || field.type === 'textarea'

    return (
      <div key={field.name} className={cn("group/field", isFullWidth ? 'col-span-full' : 'sm:col-span-1')}>
        <label className={labelClass}>
          <div className="p-1.5 bg-slate-50 rounded-lg group-hover/field:bg-primary/5 transition-colors">
            <Icon size={12} className="text-slate-400 group-hover/field:text-primary transition-colors" />
          </div>
          <span>{field.label}</span>
          {field.required && <span className="text-rose-500 font-bold ml-1">*</span>}
        </label>
        {children}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
      <AnimatePresence mode="popLayout">
        {fields.map(field => fieldWrapper(field, renderFieldInput(field)))}
      </AnimatePresence>
    </div>
  )
}

export default FormTemplateRenderer