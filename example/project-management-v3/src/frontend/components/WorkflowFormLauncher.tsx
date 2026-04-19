import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { API_URL, parseJWTToken } from '../config/api'
import { apiClient } from '../utils/apiClient'
import { useMessage } from '../hooks/useMessage'
import { useConfirm } from '../hooks/useConfirm'
import { useDynamicOptions } from '../hooks/useDynamicOptions'
import FormTemplateRenderer from './workflow/FormTemplateRenderer'
import { FormTemplate, FormField } from '../types/workflow'

interface WorkflowFormLauncherProps {
  definitionKey: string
  onSuccess?: (processInstanceId: string) => void
  onCancel?: () => void
}


const WorkflowFormLauncher: React.FC<WorkflowFormLauncherProps> = ({
  definitionKey,
  onSuccess,
  onCancel
}) => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { t } = useTranslation()
  const message = useMessage()
  const { confirm } = useConfirm()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [definition, setDefinition] = useState<any>(null)
  const [formTemplate, setFormTemplate] = useState<FormTemplate | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const { optionsMap, fetchOptions } = useDynamicOptions()
  
  const getDefaultTemplate = (): Record<string, any> => ({
    'equipment-inbound': {
      name: t('workflow_form.equipment_inbound_name'),
      fields: [
        { name: 'equipment_name', label: t('workflow_form.field.equipment_name'), type: 'text', required: true, layout: { width: 'half' } },
        { name: 'model_no', label: t('workflow_form.field.model_spec'), type: 'text', required: true, layout: { width: 'half' } },
        { name: 'brand', label: t('workflow_form.field.brand'), type: 'text', layout: { width: 'half' } },
        {
          name: 'category', label: t('workflow_form.field.category'), type: 'select', required: true, options: [
            { label: t('workflow_form.field.instrument'), value: 'instrument' },
            { label: t('workflow_form.field.fake_load'), value: 'fake_load' },
            { label: t('workflow_form.field.cable'), value: 'cable' },
            { label: t('workflow_form.field.accessory'), value: 'accessory' }
          ], layout: { width: 'half' }
        },
        { name: 'quantity', label: t('workflow_form.field.quantity'), type: 'number', required: true, layout: { width: 'half' } },
        { name: 'unit', label: t('workflow_form.field.unit'), type: 'text', defaultValue: t('workflow_form.field.unit_default'), layout: { width: 'half' } },
        { name: 'warehouse_id', label: t('workflow_form.field.warehouse'), type: 'select', required: true, dynamicOptions: 'warehouse', layout: { width: 'half' } },
        { name: 'supplier', label: t('workflow_form.field.supplier'), type: 'text', layout: { width: 'half' } },
        { name: 'purchase_date', label: t('workflow_form.field.purchase_date'), type: 'date', layout: { width: 'half' } },
        { name: 'purchase_price', label: t('workflow_form.field.purchase_price'), type: 'currency', layout: { width: 'half' } },
        { name: 'technical_params', label: t('workflow_form.field.technical_params'), type: 'textarea', layout: { width: 'full' } },
        { name: 'notes', label: t('workflow_form.field.notes'), type: 'textarea', layout: { width: 'full' } }
      ]
    }
  })

  useEffect(() => {
    loadData()
  }, [definitionKey])

  // 监控 formData 变化
  useEffect(() => {
    console.log('[WorkflowFormLauncher] formData 变化:', formData)
  }, [formData])


  const loadData = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get<any>(`${API_URL.BASE}/api/workflow/definitions/key/${definitionKey}`)
      const workflowDef = res?.data || res
      if (!workflowDef || (res && res.success === false)) throw new Error(t('workflow_form.definition_not_found'))
      setDefinition(workflowDef)

      let initialData: Record<string, any> = {}
      const fields = workflowDef.form_schema || []
      fields.forEach((field: FormField) => {
        if (field.defaultValue !== undefined) initialData[field.name] = field.defaultValue
      })
      setFormData(initialData)

      // 使用 hook 加载动态选项，避免冗余 fetch
      fetchOptions('department')
      fetchOptions('user')
      fetchOptions('warehouse')
      fetchOptions('project')
      fetchOptions('position')
      fetchOptions('customer')
    } catch (error: any) {
      console.error(t('workflow_form.load_failed'), error)
      message.error(error.message || t('workflow_form.load_failed'))
      onCancel?.()
    } finally {
      setLoading(false)
    }
  }


  const handleBusinessLink = async (fieldName: string, value: any) => {
    // 获取表单字段列表 (支持独立模板或定义内的 schema)
    const fields = formTemplate?.fields || definition?.form_schema || []
    if (fields.length === 0) return

    const triggerField = fields.find((field: any) => field.name === fieldName)
    if (!triggerField?.businessConfig?.autoFill) return

    try {
      // 优先从 formTemplate 获取上下文 ID，否则使用 definitionKey 作为回退
      const contextId = formTemplate?.id || definitionKey
      const responseData = await apiClient.post<any>(
        API_URL.WORKFLOW.FORM_TEMPLATE_LINK(contextId),
        { formData: { ...formData, [fieldName]: value } }
      )
      if (responseData && responseData.success && responseData.data?.data) {
        setFormData(prev => ({ ...prev, ...responseData.data.data }))
      }
    } catch (error) {
      console.error(t('workflow_form.link_failure'), error)
    }
  }

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [name]: value }
      return newData
    })
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }

    // 处理业务联动
    handleBusinessLink(name, value)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    const fields = formTemplate?.fields || definition?.form_schema || []

    fields.forEach((field: any) => {
      const permissions = getFieldPermissions(field)
      if (!permissions.visible) return

      // 跳过自动生成/只读/禁用的字段
      const isAutoGenerated = field.autoGenerate === true || field.readonly === true || field.disabled === true
      if (isAutoGenerated) return

      const value = formData[field.name]

      if (permissions.required && (value === undefined || value === null || value === '')) {
        newErrors[field.name] = t('workflow_form.field_required', { label: field.label })
        return
      }

      if (value !== undefined && value !== null && value !== '') {
        if (field.validation) {
          if (field.validation.min !== undefined && typeof value === 'number' && value < field.validation.min) {
            newErrors[field.name] = field.validation.message || t('workflow_form.field_min', { label: field.label, min: field.validation.min })
          }

          if (field.validation.max !== undefined && typeof value === 'number' && value > field.validation.max) {
            newErrors[field.name] = field.validation.message || t('workflow_form.field_max', { label: field.label, max: field.validation.max })
          }

          if (field.validation.pattern && typeof value === 'string') {
            const regex = new RegExp(field.validation.pattern)
            if (!regex.test(value)) {
              newErrors[field.name] = field.validation.message || t('workflow_form.field_format', { label: field.label })
            }
          }
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const getFieldPermissions = (field: FormField): {
    visible: boolean
    editable: boolean
    required: boolean
  } => {
    const visibleOn = (field as any).visibleOn
    const editableOn = (field as any).editableOn
    const checkNodeId = 'start'

    if (visibleOn && Array.isArray(visibleOn)) {
      const isVisible = visibleOn.includes(checkNodeId)
      if (!isVisible) {
        return {
          visible: false,
          editable: false,
          required: false
        }
      }
    }

    let isEditable = true
    if (editableOn && Array.isArray(editableOn)) {
      isEditable = editableOn.includes(checkNodeId)
    }

    let isRequired = field.required || false
    if (visibleOn && Array.isArray(visibleOn) && !visibleOn.includes(checkNodeId)) {
      isRequired = false
    }

    return {
      visible: true,
      editable: isEditable,
      required: isRequired
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      message.warning(t('workflow_form.validation_failed'))
      return
    }

    // 设备入库表单的管理编码校验
    if (definitionKey === 'equipment-inbound') {
      const manageCodes: string[] = []
      const duplicateCodes: string[] = []

      // 收集所有管理编码
      const items = Array.isArray(formData.items) ? formData.items : [formData]
      for (const item of items) {
        const manageCode = item.manage_code || item.item_code
        if (manageCode) {
          if (manageCodes.includes(manageCode)) {
            if (!duplicateCodes.includes(manageCode)) {
              duplicateCodes.push(manageCode)
            }
          } else {
            manageCodes.push(manageCode)
          }
        }

        // 检查配件清单中的管理编码
        if (Array.isArray(item.accessory_list)) {
          for (const acc of item.accessory_list) {
            const accManageCode = acc.manage_code || acc.item_code
            if (accManageCode) {
              if (manageCodes.includes(accManageCode)) {
                if (!duplicateCodes.includes(accManageCode)) {
                  duplicateCodes.push(accManageCode)
                }
              } else {
                manageCodes.push(accManageCode)
              }
            }
          }
        }
      }

      if (duplicateCodes.length > 0) {
        message.warning(t('workflow_form.duplicate_codes', { codes: duplicateCodes.join(', ') }))
        return
      }

      // 检查管理编码是否已存在于数据库
      for (const code of manageCodes) {
        if (!code || code.trim() === '') continue

        try {
          const result = await apiClient.get<any>(`${API_URL.BASE}/api/equipment/v3/manage-code/check`, {
            params: { code }
          })

          if (result && result.unique === false) {
            message.warning(t('workflow_form.code_exists', { code }))
            return
          }
        } catch (error) {
          console.error(t('workflow_form.code_check_failed'), error)
        }
      }
    }

    try {
      setSubmitting(true)
      const token = localStorage.getItem('token')
      let userInfo = { id: 'current-user', name: t('workflow_form.current_user') }

      if (token) {
        try {
          const payload = parseJWTToken(token)
          if (payload) {
            userInfo = {
              id: payload.userId || payload.id || 'current-user',
              name: payload.name || payload.username || payload.sub || t('workflow_form.current_user')
            }
          }
        } catch (e) {
          console.warn('Token解析失败，使用默认用户信息')
        }
      }

      const responseData = await apiClient.post<any>(`${API_URL.BASE}/api/workflow/v2/process/start`, {
        processKey: definitionKey,
        variables: {
          formData: formData
        },
        initiator: userInfo
      })

      if (responseData && (responseData.success || responseData.processInstanceId || responseData.id)) {
        const processInstanceId = responseData.processInstanceId || responseData.id || (responseData.data && (responseData.data.processInstanceId || responseData.data.id))
        message.success(t('workflow_form.start_success'))
        if (onSuccess) {
          onSuccess(processInstanceId)
        } else {
          navigate(-1)
        }
      } else {
        message.error(responseData?.error || t('workflow_form.start_failed'))
      }
    } catch (error: any) {
      console.error(t('workflow_form.start_failed'), error)
      message.error(error.message || t('workflow_form.start_failed_network'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveDraft = async () => {
    try {
      setSavingDraft(true)

      const responseData = await apiClient.post<any>(`${API_URL.BASE}/api/draft/save`, {
        templateId: definition?.id,
        templateKey: definitionKey,
        formData: formData,
        status: 'draft',
        metadata: {
          definitionName: definition?.name,
          category: definition?.category
        }
      })

      if (responseData && (responseData.success || responseData.data?.id || responseData.id)) {
        message.success(t('workflow_form.draft_saved'))
      } else {
        message.error(responseData?.error || t('workflow_form.draft_save_failed'))
      }
    } catch (error: any) {
      console.error(t('workflow_form.draft_save_failed'), error)
      message.error(error.message || t('workflow_form.draft_network_error'))
    } finally {
      setSavingDraft(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent shadow-lg shadow-blue-200"></div>
          <p className="text-gray-400 font-bold animate-pulse">{t('workflow_form.config_loading')}</p>
        </div>
      </div>
    )
  }

  if (!definition) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center bg-red-50 border border-red-100 p-8 rounded-2xl">
          <h3 className="text-lg font-bold text-red-600">{t('workflow_form.definition_not_exist')}</h3>
          <p className="text-red-400 text-sm mt-1">{t('workflow_form.definition_not_exist_desc')}</p>
          <button className="mt-6 px-8 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-lg shadow-red-200" onClick={onCancel}>{t('workflow_form.back_to_console')}</button>
        </div>
      </div>
    )
  }

  const fields = formTemplate?.fields || definition.form_schema || []

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-lg shadow-xl shadow-blue-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 -mr-16 -mt-16 bg-white opacity-5 rounded-full"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-black text-white">{definition.name}</h2>
          <div className="flex items-center gap-3 mt-2">
            {definition.category && (
              <span className="px-2.5 py-1 bg-white/20 text-white rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md border border-white/30">
                {definition.category}
              </span>
            )}
            <span className="text-blue-100/70 text-xs font-medium italic">{t('workflow.version_label')}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
          <FormTemplateRenderer
            fields={fields}
            data={formData}
            onFieldChange={handleFieldChange}
            mode="create"
            userMap={Object.fromEntries(optionsMap.user?.map(o => [o.value, o.label]) || [])}
            departmentMap={Object.fromEntries(optionsMap.department?.map(o => [o.value, o.label]) || [])}
            warehouseMap={Object.fromEntries(optionsMap.warehouse?.map(o => [o.value, o.label]) || [])}
            projectMap={Object.fromEntries(optionsMap.project?.map(o => [o.value, o.label]) || [])}
            positionMap={Object.fromEntries(optionsMap.position?.map(o => [o.value, o.label]) || [])}
            customerMap={Object.fromEntries(optionsMap.customer?.map(o => [o.value, o.label]) || [])}
          />

          {Object.keys(errors).length > 0 && (
            <div className="mt-8 p-6 bg-red-50 rounded-lg border border-red-100 animate-in shake duration-500">
              <h4 className="font-bold text-red-800 flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                {t('workflow_form.fix_errors')}
              </h4>
              <ul className="space-y-1 text-sm text-red-600 font-medium">
                {Object.values(errors).map((error, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="opacity-40">•</span>
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-end pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-3 bg-white border border-gray-200 text-gray-500 font-bold rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-all"
            disabled={submitting || savingDraft}
          >
            {t('workflow_form.back_to_list')}
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-8 py-3 bg-white border-2 border-amber-400 text-amber-600 font-black rounded-lg hover:bg-amber-50 disabled:opacity-30 disabled:grayscale transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-50"
            disabled={submitting || savingDraft}
          >
            {savingDraft ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-amber-600 border-t-transparent"></div>
                {t('workflow_form.draft_locking')}
              </>
            ) : (
              t('workflow_form.save_draft')
            )}
          </button>
          <button
            type="submit"
            className="px-10 py-3 bg-blue-600 text-white font-black rounded-lg hover:bg-blue-700 disabled:opacity-30 disabled:grayscale transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-200 scale-100 hover:scale-105 active:scale-95"
            disabled={submitting || savingDraft}
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                {t('workflow_form.dispatching')}
              </>
            ) : (
              t('workflow_form.submit')
            )}
          </button>
        </div>
      </form>

      <div className="py-12 border-t border-dashed border-gray-200 text-center">
        <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">{t('workflow.footer_label')}</p>
      </div>
    </div>
  )
}

export default WorkflowFormLauncher
