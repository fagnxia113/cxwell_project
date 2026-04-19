/**
 * 流程表单启动器组件
 * 基于流程表单预设，自动加载表单字段并处理流程启动
 */
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { API_URL, parseJWTToken } from '../config/api'
import { apiClient } from '../utils/apiClient'
import { useMessage } from '../hooks/useMessage'
import { useDynamicOptions } from '../hooks/useDynamicOptions'

interface ProcessFormLauncherProps {
  presetId: string
  onSuccess?: (processInstanceId: string) => void
  onCancel?: () => void
}

interface FormField {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'user' | 'boolean' | 'lookup' | 'reference'
  required: boolean
  placeholder?: string
  defaultValue?: any
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  options?: { label: string; value: any }[]
  rows?: number
  cols?: number
  disabled?: boolean
  readonly?: boolean
  hidden?: boolean
  group?: string
  dependencies?: {
    field: string
    value: any
    operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains' | 'notContains'
  }[]
  validation?: {
    message?: string
    custom?: string
  }
  businessConfig?: {
    module?: string
    entityType?: string
    lookupField?: string
    displayField?: string
    filter?: Record<string, any>
    autoFill?: boolean
  }
  dynamicOptions?: 'department' | 'position' | 'employee' | 'project' | 'warehouse'
  dynamicOptionsConfig?: {
    source: string
    labelField: string
    valueField: string
    filter?: Record<string, any>
  }
  refEntity?: string
  refLabel?: string
  refValue?: string
  cascadeFrom?: string
  cascadeField?: string
}

interface ProcessFormPreset {
  id: string
  name: string
  category: string
  description: string
  formTemplateKey: string
  workflowTemplateId: string
  businessType: string
  status: 'active' | 'inactive'
  defaultVariables: Record<string, any>
  version: string
}

const ProcessFormLauncher: React.FC<ProcessFormLauncherProps> = ({ presetId, onSuccess, onCancel }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const message = useMessage()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, any>>({})
  const [preset, setPreset] = useState<ProcessFormPreset | null>(null)
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { optionsMap, fetchOptions } = useDynamicOptions()

  // 加载级联选项
  const loadCascadeOptions = async (field: FormField, parentValue: any) => {
    if (!field.refEntity || !field.cascadeField) return
    
    try {
      const queryParam = field.cascadeField === 'department_id' ? 'department_id' : field.cascadeField
      const params: Record<string, any> = {}
      if (parentValue) {
        params[queryParam] = parentValue
      }
      
      const data = await apiClient.get<any>(`${API_URL.BASE}/api/organization/${field.refEntity}`, { params })

      if (data && Array.isArray(data.data)) {
        const labelField = field.refLabel || 'name'
        const valueField = field.refValue || 'id'
        
        setDynamicOptions(prev => ({
          ...prev,
          [field.name]: data.data.map((item: any) => ({
            label: item[labelField],
            value: item[valueField]
          }))
        }))
      }
    } catch (error) {
      console.error(t('process_form_launcher.load_field_options_failed', { label: field.label }), error)
    }
  }

  // 加载动态选项
  const loadOptionsForFields = async (fields: FormField[]) => {
    for (const field of fields) {
      if (field.dynamicOptions) {
        fetchOptions(field.dynamicOptions, field.dynamicOptionsConfig)
      } else if (field.type === 'user') {
        fetchOptions('user')
      } else if (field.businessConfig?.entityType) {
        fetchOptions(field.businessConfig.entityType, {
          source: `/api/data/${field.businessConfig.entityType}`,
          labelField: field.businessConfig.displayField || 'name',
          valueField: field.businessConfig.lookupField || 'id'
        })
      }
    }
  }

  // 加载流程表单预设和字段
  useEffect(() => {
    const loadPresetAndFields = async () => {
      try {
        setLoading(true)

        const [presetData, fieldsData, defaultValuesData] = await Promise.all([
          apiClient.get<any>(API_URL.WORKFLOW.FORM_PRESET_DETAIL(presetId)),
          apiClient.get<any>(API_URL.WORKFLOW.FORM_PRESET_FORM_FIELDS(presetId)),
          apiClient.get<any>(API_URL.WORKFLOW.FORM_PRESET_DEFAULT_VALUES(presetId))
        ])

        if (presetData && fieldsData && defaultValuesData) {
          setPreset(presetData)
          setFormFields(fieldsData)
          setFormData(defaultValuesData)
          setErrors({})
          await loadOptionsForFields(fieldsData)
        } else {
          throw new Error(t('process_form_launcher.load_preset_failed'))
        }
      } catch (error: any) {
        console.error(t('process_form_launcher.load_preset_failed'), error)
        message.error(error.message || t('process_form_launcher.load_form_failed'))
        onCancel?.()
      } finally {
        setLoading(false)
      }
    }

    if (presetId) {
      loadPresetAndFields()
    }
  }, [presetId])

  // 检查字段是否可见
  const isFieldVisible = (field: FormField): boolean => {
    if (!field.dependencies || field.dependencies.length === 0) {
      return true
    }
    return field.dependencies.every(dep => {
      const fieldValue = formData[dep.field]
      switch (dep.operator) {
        case 'equals': return fieldValue === dep.value
        case 'notEquals': return fieldValue !== dep.value
        case 'greaterThan': return fieldValue > dep.value
        case 'lessThan': return fieldValue < dep.value
        case 'contains': return Array.isArray(fieldValue) ? fieldValue.includes(dep.value) : String(fieldValue).includes(String(dep.value))
        case 'notContains': return Array.isArray(fieldValue) ? !fieldValue.includes(dep.value) : !String(fieldValue).includes(String(dep.value))
        default: return true
      }
    })
  }

  // 处理业务数据联动
  const handleBusinessLink = async (fieldName: string, value: any) => {
    if (!preset || !value) return
    const triggerField = formFields.find(field => field.name === fieldName)
    if (!triggerField?.businessConfig?.autoFill) return

    try {
      const formTemplateId = preset.formTemplateKey
      const responseData = await apiClient.post<any>(API_URL.WORKFLOW.FORM_TEMPLATE_LINK(formTemplateId), {
         formData: { ...formData, [fieldName]: value } 
      })
      if (responseData && responseData.success) {
        setFormData(prev => ({ ...prev, ...responseData.data }))
      }
    } catch (error) {
      console.error(t('process_form_launcher.linkage_failed'), error)
    }
  }

  // 处理表单输入变化
  const handleInputChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
    const cascadeFields = formFields.filter(f => f.cascadeFrom === fieldName)
    for (const cascadeField of cascadeFields) {
      if (cascadeField.type === 'reference' && cascadeField.refEntity && cascadeField.cascadeField) {
        loadCascadeOptions(cascadeField, value)
      }
    }
    handleBusinessLink(fieldName, value)
  }

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    formFields.forEach(field => {
      if (!isFieldVisible(field)) return
      const value = formData[field.name]
      if (field.required && !value && value !== false) {
        newErrors[field.name] = t('process_form_launcher.field_required', { label: field.label })
        return
      }
      if (value) {
        switch (field.type) {
          case 'number':
            if (isNaN(Number(value))) newErrors[field.name] = t('process_form_launcher.field_must_number', { label: field.label })
            break
          case 'date':
            if (isNaN(new Date(value).getTime())) newErrors[field.name] = t('process_form_launcher.field_date_invalid', { label: field.label })
            break
        }
        if ((field.type === 'text' || field.type === 'textarea') && typeof value === 'string') {
          if (field.minLength && value.length < field.minLength) newErrors[field.name] = t('process_form_launcher.field_min_length', { label: field.label, min: field.minLength })
          if (field.maxLength && value.length > field.maxLength) newErrors[field.name] = t('process_form_launcher.field_max_length', { label: field.label, max: field.maxLength })
        }
        if (field.type === 'number' && typeof value === 'number') {
          if (field.min !== undefined && value < field.min) newErrors[field.name] = t('process_form_launcher.field_min_value', { label: field.label, min: field.min })
          if (field.max !== undefined && value > field.max) newErrors[field.name] = t('process_form_launcher.field_max_value', { label: field.label, max: field.max })
        }
        if (field.pattern && typeof value === 'string') {
          if (!new RegExp(field.pattern).test(value)) newErrors[field.name] = field.validation?.message || t('process_form_launcher.field_format_invalid', { label: field.label })
        }
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      message.warning(t('process_form_launcher.validation_failed'))
      return
    }
    try {
      setSubmitting(true)
      const token = localStorage.getItem('token')
      let userInfo = { id: 'current-user', name: t('process_form_launcher.current_user') }
      if (token) {
        try {
          const payload = parseJWTToken(token)
          if (payload) {
            userInfo = { 
              id: payload.userId || payload.id || 'current-user', 
              name: payload.name || payload.username || payload.sub || t('process_form_launcher.current_user') 
            }
          }
        } catch (e) {
          console.warn(t('process_form_launcher.token_parse_failed'))
        }
      }

      const responseData = await apiClient.post<any>(API_URL.WORKFLOW.FORM_PRESET_START(presetId), {
         formData, 
         initiator: userInfo 
      })

      if (responseData && (responseData.success || responseData.processInstanceId || responseData.id)) {
        const processInstanceId = responseData.processInstanceId || responseData.id || (responseData.data && (responseData.data.processInstanceId || responseData.data.id))
        message.success(t('process_form_launcher.start_success'))
        if (onSuccess) {
          onSuccess(processInstanceId)
        } else {
          navigate(-1)
        }
      } else {
        message.error(responseData?.error || t('process_form_launcher.start_failed'))
        if (responseData?.data?.formValidation?.errors) {
          const validationErrors: Record<string, string> = {}
          responseData.data.formValidation.errors.forEach((error: any) => {
            validationErrors[error.field] = error.message
          })
          setErrors(validationErrors)
        }
      }
    } catch (error: any) {
      console.error(t('process_form_launcher.start_failed'), error)
      message.error(error.message || t('process_form_launcher.start_failed_network'))
    } finally {
      setSubmitting(false)
    }
  }

  // 渲染单个字段
  const renderField = (field: FormField) => {
    if (!isFieldVisible(field)) return null

    const hasError = !!errors[field.name];

    return (
      <div key={field.name} className="form-group animate-in fade-in slide-in-from-bottom-2 duration-300 group/field">
        <label htmlFor={field.name} className={`form-label font-bold text-xs uppercase tracking-widest ${field.required ? 'after:content-["*"] after:ml-1 after:text-red-500' : ''} ${hasError ? 'text-red-600' : 'group-focus-within/field:text-blue-600'}`}>
          {field.label}
        </label>
        <div className="relative mt-1">
          {field.type === 'text' && (
            <input type="text" id={field.name} name={field.name}
              className={`form-control rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all ${hasError ? 'border-red-500 focus:ring-red-500/10' : ''}`}
              placeholder={field.placeholder} value={formData[field.name] || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              disabled={field.disabled} readOnly={field.readonly} />
          )}
          {field.type === 'number' && (
            <input type="number" id={field.name} name={field.name}
              className={`form-control rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all ${hasError ? 'border-red-500 focus:ring-red-500/10' : ''}`}
              placeholder={field.placeholder}
              value={formData[field.name] !== undefined ? formData[field.name] : ''}
              onChange={(e) => handleInputChange(field.name, parseFloat(e.target.value) || '')}
              disabled={field.disabled} readOnly={field.readonly} min={field.min} max={field.max} />
          )}
          {field.type === 'date' && (
            <input type="date" id={field.name} name={field.name}
              className={`form-control rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all ${hasError ? 'border-red-500 focus:ring-red-500/10' : ''}`}
              value={formData[field.name] || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              disabled={field.disabled} readOnly={field.readonly} />
          )}
          {(field.type === 'select' || field.type === 'reference' || field.type === 'user' || field.type === 'lookup') && (
            <div className="relative group/select">
              <select id={field.name} name={field.name}
                className={`form-control rounded-xl appearance-none border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all ${hasError ? 'border-red-500 focus:ring-red-500/10' : ''}`}
                value={formData[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                disabled={field.disabled || field.readonly}>
                <option value="">{t('common.please_select')}</option>
                {field.options?.map((opt, i) => (
                  <option key={field.name + '_' + i} value={typeof opt === 'object' ? opt.value : opt}>
                    {typeof opt === 'object' ? opt.label : opt}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover/select:text-blue-500 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          )}

          {field.type === 'textarea' && (
            <textarea id={field.name} name={field.name} rows={field.rows || 4}
              className={`form-control rounded-2xl min-h-[120px] resize-none border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all ${hasError ? 'border-red-500 focus:ring-red-500/10' : ''}`}
              placeholder={field.placeholder} value={formData[field.name] || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              disabled={field.disabled} readOnly={field.readonly} />
          )}
          {field.type === 'boolean' && (
            <div className="flex items-center gap-3 py-2">
              <label className="relative inline-flex items-center cursor-pointer group/toggle">
                <input type="checkbox" id={field.name} name={field.name}
                  className="sr-only peer"
                  checked={formData[field.name] || false}
                  onChange={(e) => handleInputChange(field.name, e.target.checked)}
                  disabled={field.disabled} />
                <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
                <span className="ml-3 text-sm font-bold text-slate-700 tracking-tight">{field.label}</span>
              </label>
            </div>
          )}
          
          {hasError && (
            <div className="flex items-center gap-1.5 mt-2 ml-1 text-red-500 animate-in fade-in slide-in-from-top-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-[10px] font-black uppercase tracking-widest">{errors[field.name]}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-6">
        <div className="relative">
          <div className="w-20 h-20 border-[6px] border-blue-500/10 border-t-blue-500 rounded-full animate-spin shadow-xl"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 bg-blue-500/20 rounded-full animate-pulse"></div>
          </div>
        </div>
        <p className="text-[10px] font-black text-slate-400 tracking-[0.4em] uppercase animate-pulse">{t('process_form_launcher.config_loading_text')}</p>
      </div>
    )
  }

  if (!preset) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="bg-white border border-gray-100 rounded-[2rem] p-10 text-center max-w-sm shadow-2xl shadow-gray-200/50">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">{t('process_form_launcher.config_load_failed_title')}</h3>
          <p className="text-slate-400 text-sm mt-2 font-medium">{t('process_form_launcher.config_load_failed_desc')}</p>
          <button className="w-full mt-8 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black transition-all" onClick={onCancel}>{t('process_form_launcher.back_to_console')}</button>
        </div>
      </div>
    )
  }

  if (preset.status !== 'active') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="bg-white border border-gray-100 rounded-[2rem] p-10 text-center max-w-sm shadow-2xl shadow-gray-200/50">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">{t('process_form_launcher.business_disabled_title')}</h3>
          <p className="text-slate-400 text-sm mt-2 font-medium">{t('process_form_launcher.business_disabled_desc')}</p>
          <button className="w-full mt-8 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black transition-all" onClick={onCancel}>{t('process_form_launcher.back_to_console')}</button>
        </div>
      </div>
    )
  }

  // 按分组组织表单字段
  const groupedFields = formFields.reduce((groups, field) => {
    const group = field.group || t('process_form_launcher.basic_info_group')
    if (!groups[group]) groups[group] = []
    groups[group].push(field)
    return groups
  }, {} as Record<string, FormField[]>)

  // 分组顺序
  const groupOrder = [t('process_form_launcher.basic_info_group'), t('process_form_launcher.project_scale_group'), t('process_form_launcher.tech_arch_group'), t('process_form_launcher.business_info_group'), t('process_form_launcher.project_phase_group')]
  // 添加其他未在顺序中的分组
  Object.keys(groupedFields).forEach(group => {
    if (!groupOrder.includes(group)) groupOrder.push(group)
  })

  return (
    <div className="max-w-5xl mx-auto py-10 space-y-12 animate-in fade-in duration-700">
      <div className="relative pl-8">
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]"></div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter sm:text-5xl">{preset.name}</h2>
        <div className="mt-4 flex flex-wrap items-center gap-4">
           <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border border-blue-100">
              {preset.version || 'v1.0.0'}
           </span>
           <p className="text-slate-500 font-bold text-lg">{preset.description}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        {groupOrder.map((groupName, groupIdx) => {
          const fields = groupedFields[groupName]
          const visibleFields = fields?.filter(isFieldVisible)
          if (!visibleFields || visibleFields.length === 0) return null
          
          return (
            <div key={groupName} className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-xl shadow-gray-100/50 relative overflow-hidden group/card transition-all hover:shadow-2xl hover:shadow-gray-200/40">
              <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover/card:opacity-[0.04] transition-opacity pointer-events-none -rotate-12 translate-x-4 -translate-y-4">
                <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14h-2i-2h-2v-2h2v-2h-2v-2h2V7h2v2h2v2h-2v2h2v2z"/>
                </svg>
              </div>
              
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-base shadow-xl shadow-slate-200 rotate-3 group-hover/card:rotate-12 transition-transform">
                  {(groupIdx + 1).toString().padStart(2, '0')}
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight group-hover/card:text-blue-600 transition-colors">{groupName}</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                {fields.map(renderField)}
              </div>
            </div>
          )
        })}

        <div className="sticky bottom-8 z-50 px-4">
           <div className="max-w-3xl mx-auto bg-slate-900/90 backdrop-blur-2xl rounded-[2rem] p-4 border border-white/10 shadow-2xl shadow-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-6 transition-all hover:bg-slate-900">
              <div className="pl-6 hidden md:block">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                    Data Integrity Check — Enabled
                 </p>
                 <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-[11px] text-white/50 font-bold">{t('process_form_launcher.channel_ready')}</span>
                 </div>
              </div>
              
              <div className="flex w-full sm:w-auto gap-4 p-1">
                <button type="button" className="flex-1 sm:flex-none px-8 py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 hover:text-white transition-all border border-white/10" onClick={onCancel} disabled={submitting}>{t('process_form_launcher.abort')}</button>
                <button type="submit" className="flex-1 sm:flex-none px-12 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3" disabled={submitting}>
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span className="uppercase tracking-widest text-xs">Processing</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                      {t('process_form_launcher.validate_and_submit')}
                    </>
                  )}
                </button>
              </div>
           </div>
        </div>
      </form>
      
      <div className="pt-20 pb-10 text-center opacity-20">
         <p className="text-[9px] font-black text-slate-900 uppercase tracking-[0.5em]">Centralized Process Backbone v4.0 — High Availability Architecture</p>
      </div>
    </div>
  )
}

export default ProcessFormLauncher