import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { workflowApi } from '../api/workflowApi'
import { formApi } from '../api/formApi'
import { useMessage } from '../hooks/useMessage'
import { useConfirm } from '../hooks/useConfirm'
import FormTemplateRenderer from './workflow/FormTemplateRenderer'
import { motion } from 'framer-motion'
import { Send, Save, ArrowLeft, Loader2, FileText, Hash, Calendar, User } from 'lucide-react'

interface WorkflowFormLauncherProps {
  definitionKey: string
  draftId?: string
  onSuccess?: (instanceId: string) => void
  onCancel?: () => void
}

const WorkflowFormLauncher: React.FC<WorkflowFormLauncherProps> = ({
  definitionKey,
  draftId,
  onSuccess,
  onCancel
}) => {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const message = useMessage()
  const { confirm } = useConfirm()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)

  const [definition, setDefinition] = useState<any>(null)
  const [formFields, setFormFields] = useState<any[]>([])
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [title, setTitle] = useState('')

  useEffect(() => {
    loadData()
    // 从 URL 提取初始参数 (如 project_id)
    const query = new URLSearchParams(window.location.search)
    const urlProjectId = query.get('project_id')
    if (urlProjectId) {
      setFormData(prev => ({ ...prev, project_id: urlProjectId }))
    }
  }, [definitionKey, draftId])

  const loadData = async () => {
    try {
      setLoading(true)
      const defsRes = await workflowApi.getDefinitions()
      if (defsRes.success && defsRes.data) {
        const target = defsRes.data.find((d: any) => d.flowCode === definitionKey)
        setDefinition(target)
        if (target) {
          setTitle(`${target.flowName || ''}-${new Date().toLocaleDateString(i18n.language)}`)
          
          if (target.id) {
            try {
              const defDetailRes = await workflowApi.getDefinitionDetail(target.id.toString())
              if (defDetailRes?.success && defDetailRes?.data) {
                const defData = defDetailRes.data.definition || defDetailRes.data
                let fields: any[] = []
                if (defData.ext) {
                  try {
                    const parsed = JSON.parse(defData.ext)
                    fields = parsed.form_schema || parsed.fields || parsed.form_fields || []
                  } catch { fields = [] }
                }
                if (typeof fields === 'string') {
                  try { fields = JSON.parse(fields) } catch { fields = [] }
                }
                if (Array.isArray(fields) && fields.length > 0) {
                  setFormFields(fields)
                }
              }
            } catch (e) {
              console.warn('Failed to load definition detail for form fields')
            }
          }
        }
      }

      try {
        const formRes = await formApi.getTemplate(definitionKey)
        if (formRes.success && formRes.data) {
          const fields = formRes.data.fields || []
          if (fields.length > 0) setFormFields(fields)
        }
      } catch (e) {
        console.warn('Form template not found for key:', definitionKey)
      }

      if (draftId) {
        const taskRes = await workflowApi.getTaskDetail(draftId)
        if (taskRes.success && taskRes.data) {
          const draftData = taskRes.data.form_data || {}
          setFormData(draftData)
          if (draftData._title) setTitle(draftData._title)
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
        variables: { ...formData, _title: title }
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

    if (!title.trim()) {
      return message.warning(t('workflow.please_fill_title') || '请填写申请标题')
    }

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
        res = await workflowApi.submitWorkflowDraft(draftId)
      } else {
        res = await workflowApi.startProcess({
          flowCode: definitionKey,
          title: title,
          variables: { ...formData, _title: title }
        })
      }

      if (res.success) {
        message.success('流程申请已成功提交')

        if (onSuccess) {
          onSuccess(res.data.id || res.data.instanceId)
        } else {
          navigate('/approvals/center')
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

  const now = new Date()
  const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`
  const prefix = definitionKey ? definitionKey.substring(0, 3).toUpperCase() : 'WF'
  const documentNo = `${prefix}-${dateStr}-****`

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-2xl shadow-xl shadow-blue-200/50 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 -mr-20 -mt-20 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 -ml-10 -mb-10 bg-indigo-400/20 rounded-full blur-2xl" />

        <div className="relative z-10">
          <h2 className="text-2xl font-black text-white tracking-tight">{definition?.flowName || definitionKey}</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="px-2.5 py-1 bg-white/20 text-white rounded-lg text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/30">
              {definition?.category || 'PROPOSAL'}
            </span>
            <span className="text-blue-100/70 text-xs font-bold italic">Version {definition?.version || '1.0'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={onCancel || (() => navigate(-1))}
            className="px-6 py-2.5 bg-white/20 text-white rounded-xl text-sm font-black flex items-center gap-2 hover:bg-white/30 transition-all border border-white/20 backdrop-blur-sm"
          >
            <ArrowLeft size={16} />
            {t('common.back')}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-lg shadow-slate-200/30">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-5">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            {t('workflow.basic_info') || '基本信息'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                {t('workflow.fields.title') || '申请标题'} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('workflow.placeholder.title') || '请输入申请标题'}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 text-sm font-medium transition-all focus:ring-4 focus:ring-primary/10 focus:border-primary hover:border-slate-300 shadow-sm"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                <Hash className="w-3 h-3" />
                {t('workflow.fields.document_no') || '单据编号'}
              </label>
              <input
                type="text"
                value={documentNo}
                disabled
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-400 text-sm font-mono italic cursor-default shadow-inner"
              />
              <p className="text-[10px] text-gray-400 mt-1">{t('workflow.hint.auto_generate') || '提交后自动生成'}</p>
            </div>
            <div>
              <label className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                <Calendar className="w-3 h-3" />
                {t('workflow.fields.apply_date') || '申请日期'}
              </label>
              <input
                type="text"
                value={now.toLocaleDateString(i18n.language)}
                disabled
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-600 text-sm font-medium cursor-default shadow-inner"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                <User className="w-3 h-3" />
                {t('workflow.fields.applicant') || '申请人'}
              </label>
              <input
                type="text"
                value={localStorage.getItem('userName') || '当前用户'}
                disabled
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-600 text-sm font-medium cursor-default shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Form Fields Card */}
        {formFields.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-lg shadow-slate-200/30">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-5">
              <div className="p-1.5 bg-emerald-100 rounded-lg">
                <FileText className="w-4 h-4 text-emerald-600" />
              </div>
              {t('workflow.application_content') || '申请内容'}
            </h3>
            <FormTemplateRenderer
              fields={formFields}
              data={formData}
              onFieldChange={handleFieldChange}
              mode="create"
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4 pb-12">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={savingDraft || submitting}
            className="px-10 py-3.5 bg-white text-amber-600 border-2 border-amber-400/30 rounded-xl text-sm font-black flex items-center justify-center gap-3 hover:bg-amber-50 hover:border-amber-400 transition-all disabled:opacity-50 shadow-lg shadow-amber-50"
          >
            {savingDraft ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {t('workflow.save_draft')}
          </button>

          <button
            type="submit"
            disabled={submitting || savingDraft}
            className="px-16 py-3.5 bg-blue-600 text-white rounded-xl text-sm font-black shadow-xl shadow-blue-200 flex items-center justify-center gap-3 hover:bg-blue-700 hover:translate-y-[-2px] active:translate-y-[1px] transition-all disabled:opacity-50"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            {t('workflow.submit_proposal')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default WorkflowFormLauncher
