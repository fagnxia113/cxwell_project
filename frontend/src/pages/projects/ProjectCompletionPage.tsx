/**
 * 项目结项申请页面
 */
import React, { useState, useEffect } from 'react'
import { apiClient } from '../../utils/apiClient'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMessage } from '../../hooks/useMessage'

interface Project {
  id: string
  name: string
  status: string
  progress: number
  manager: string
  planned_end_date: string
}

export default function ProjectCompletionPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { success, error: showError } = useMessage()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    project_id: '',
    completion_date: new Date().toISOString().split('T')[0],
    summary: '',
    deliverables: '',
    achievements: '',
    lessons_learned: '',
    remarks: ''
  })

  useEffect(() => { 
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const data = await apiClient.get<any>('/api/data/projects')
      if (data) {
        const projectList = data.items || data.data || data || []
        setProjects(projectList.filter((p: Project) => p.status === 'in_progress'))
      }
    } catch (e: any) { 
      console.error(e)
      showError(e.message || t('common.error'))
    } finally { 
      setLoading(false) 
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.project_id) { 
      showError(t('project.completion.select'))
      return 
    }
    
    const project = projects.find(p => p.id === formData.project_id)
    
    setSubmitting(true)
    try {
      // 使用工作流API启动项目结项流程
      const result = await apiClient.post<any>('/api/workflow/processes', {
        definitionKey: 'project_completion',
        title: `${t('project.completion.title')} - ${project?.name}`,
        businessKey: formData.project_id,
        variables: {
          projectId: formData.project_id,
          projectName: project?.name,
          completionDate: formData.completion_date,
          summary: formData.summary,
          deliverables: formData.deliverables,
          achievements: formData.achievements,
          lessonsLearned: formData.lessons_learned,
          remarks: formData.remarks
        }
      })
      
      if (result && (result.success || result.id)) { 
        success(t('project.completion.submit_success'))
        setFormData({ 
          project_id: '', 
          completion_date: new Date().toISOString().split('T')[0], 
          summary: '', 
          deliverables: '', 
          achievements: '', 
          lessons_learned: '', 
          remarks: '' 
        })
        navigate('/projects')
      } else {
        showError(t('project_completion.submit_failed', { error: result?.error || result?.message || t('project_completion.unknown_error') }))
      }
    } catch (e: any) { 
      showError(t('common.submit_failed') + ': ' + (e.message || t('common.network_error')))
    } finally { 
      setSubmitting(false) 
    }
  }

  if (loading) return <div className="flex justify-center items-center h-64">{t('common.loading')}</div>

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-700">{t('project.completion.title')}</h1>
        <p className="text-gray-500 mt-1">{t('project.completion.desc')}</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('project.completion.select')} <span className="text-red-500">*</span></label>
          <select 
            value={formData.project_id} 
            onChange={(e) => setFormData({...formData, project_id: e.target.value})} 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
            required
          >
            <option value="">{t('project.completion.select')}</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.progress}%)</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('project.fields.end_date')} <span className="text-red-500">*</span></label>
          <input 
            type="date" 
            value={formData.completion_date} 
            onChange={(e) => setFormData({...formData, completion_date: e.target.value})} 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" 
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('project.completion.summary')} <span className="text-red-500">*</span></label>
          <textarea 
            value={formData.summary} 
            onChange={(e) => setFormData({...formData, summary: e.target.value})} 
            rows={4} 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" 
            required 
            placeholder={t('project.completion.summary')} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('project.completion.deliverables')}</label>
          <textarea 
            value={formData.deliverables} 
            onChange={(e) => setFormData({...formData, deliverables: e.target.value})} 
            rows={3} 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" 
            placeholder={t('project.completion.deliverables')} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('project.completion.achievements')}</label>
          <textarea 
            value={formData.achievements} 
            onChange={(e) => setFormData({...formData, achievements: e.target.value})} 
            rows={3} 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" 
            placeholder={t('project.completion.achievements')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('project.completion.lessons')}</label>
          <textarea 
            value={formData.lessons_learned} 
            onChange={(e) => setFormData({...formData, lessons_learned: e.target.value})} 
            rows={3} 
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" 
            placeholder={t('project.completion.lessons')}
          />
        </div>
        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
          <button 
            type="button" 
            onClick={() => navigate(-1)} 
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button 
            type="submit" 
            disabled={submitting} 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {submitting ? t('common.loading') : t('common.confirm')}
          </button>
        </div>
      </form>
    </div>
  )
}
