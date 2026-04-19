import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { workflowApi } from '../api/workflowApi'
import { formApi } from '../api/formApi'
import { useMessage } from '../hooks/useMessage'
import { useConfirm } from '../hooks/useConfirm'
import FormTemplateRenderer from './workflow/FormTemplateRenderer'
import { motion } from 'framer-motion'
import { Send, Save, ArrowLeft, Loader2 } from 'lucide-react'

interface WorkflowFormLauncherProps {
  definitionKey: string
  draftId?: string // 新增：支持从草稿加载
  onSuccess?: (instanceId: string) => void
  onCancel?: () => void
}

const WorkflowFormLauncher: React.FC<WorkflowFormLauncherProps> = ({
  definitionKey,
  onSuccess,
  onCancel
}) => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const message = useMessage()
  const { confirm } = useConfirm()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)

  const [definition, setDefinition] = useState<any>(null)
  const [formFields, setFormFields] = useState<any[]>([])
  const [formData, setFormData] = useState<Record<string, any>>({})

  useEffect(() => {
    loadData()
  }, [definitionKey, draftId])

  const loadData = async () => {
    try {
      setLoading(true)
      // 1. 加载流程定义 (改为通过 getDefinitions 寻找，或通过后端单个查询)
      const defsRes = await workflowApi.getDefinitions()
      if (defsRes.success && defsRes.data) {
        const target = defsRes.data.find((d: any) => d.flowCode === definitionKey)
        setDefinition(target)
      }

      // 2. 加载表单模板
      const formRes = await formApi.getTemplate(definitionKey)
      if (formRes.success && formRes.data) {
        setFormFields(formRes.data.fields || [])
      }

      // 3. 尝试加载草稿数据 (如果提供了 draftId)
      if (draftId) {
        const taskRes = await workflowApi.getTaskDetail(draftId)
        if (taskRes.success && taskRes.data) {
          setFormData(taskRes.data.form_data || {})
          message.success('已恢复草稿数据')
        }
      }
    } catch (error: any) {
      console.error('Failed to load workflow form data:', error)
      message.error('加载表单数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSaveDraft = async () => {
    try {
      setSavingDraft(true)
      await workflowApi.saveWorkflowDraft({
        definitionId: definition?.id?.toString(),
        businessId: `DRAFT-${Date.now()}`,
        variables: formData
      })
      message.success('草稿已成功保存至草稿箱')
    } catch (e: any) {
      message.error('保存草稿失败: ' + e.message)
    } finally {
      setSavingDraft(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 简单校验
    const missingFields = formFields.filter(f => f.required && !formData[f.name])
    if (missingFields.length > 0) {
      return message.warning(t('workflow.please_fill_required'))
    }

    const confirmed = await confirm({
      title: t('workflow.submit_confirm_title'),
      content: t('workflow.submit_confirm_content'),
      type: 'primary'
    })

    if (!confirmed) return

    try {
      setSubmitting(true)
      
      let res;
      if (draftId) {
        // 如果是提交草稿
        res = await workflowApi.submitWorkflowDraft(draftId)
      } else {
        // 如果是直接发起
        res = await workflowApi.startProcess({
          flowCode: definitionKey,
          variables: formData
        })
      }

      if (res.success) {
        message.success('流程申请已成功提交')
        
        if (onSuccess) {
          onSuccess(res.data.id || res.data.instanceId)
        } else {
          navigate('/workflow/todo')
        }
      }
    } catch (error: any) {
      message.error(error.message || t('workflow.submit_failed'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-slate-400 font-bold animate-pulse">{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header Area */}
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 -mr-20 -mt-20 bg-primary/5 rounded-full blur-3xl" />
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{definition?.flowName || definitionKey}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[10px] font-black uppercase tracking-wider border border-primary/20">
              {definition?.category || 'PROPOSAL'}
            </span>
            <span className="text-slate-400 text-xs font-medium">v{definition?.version || '1.0'}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={onCancel || (() => navigate(-1))}
            className="px-5 py-2.5 bg-slate-50 text-slate-500 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-100 transition-all border border-slate-100"
          >
            <ArrowLeft size={16} />
            {t('common.back')}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-3xl p-10 border border-slate-100 shadow-xl shadow-slate-200/50">
          <FormTemplateRenderer
            fields={formFields}
            data={formData}
            onFieldChange={handleFieldChange}
            mode="create"
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={savingDraft || submitting}
            className="px-8 py-3.5 bg-white text-amber-600 border-2 border-amber-500/20 rounded-2xl text-sm font-black flex items-center justify-center gap-2 hover:bg-amber-50 transition-all disabled:opacity-50"
          >
            {savingDraft ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {t('workflow.save_draft')}
          </button>
          
          <button
            type="submit"
            disabled={submitting || savingDraft}
            className="px-12 py-3.5 bg-primary text-white rounded-2xl text-sm font-black shadow-xl shadow-primary/30 flex items-center justify-center gap-2 hover:translate-y-[-2px] active:translate-y-[1px] transition-all disabled:opacity-50"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {t('workflow.submit_proposal')}
          </button>
        </div>
      </form>
    </div>
  )
}

export default WorkflowFormLauncher
