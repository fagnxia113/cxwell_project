import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { formApi } from '../../api/formApi'
import { workflowApi } from '../../api/workflowApi'
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  Search,
  Copy,
  Layout,
  Layers
} from 'lucide-react'

interface FormTemplate {
  id: string
  name: string
  version: number
  layout: {
    type: 'single' | 'tabs' | 'steps'
    columns: number
    labelPosition?: 'left' | 'right' | 'top'
  }
  fields: any[]
  sections?: any[]
  style?: any
  created_at: string
  updated_at: string
}

interface WorkflowDefinition {
  id: string
  key: string
  name: string
  form_template_id?: string
}

const FormTemplatesPage: React.FC = () => {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<FormTemplate[]>([])
  const [workflowDefinitions, setWorkflowDefinitions] = useState<WorkflowDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<FormTemplate | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const [templatesRes, definitionsRes] = await Promise.all([
        formApi.getTemplates(),
        workflowApi.getDefinitions()
      ])
      
      if (templatesRes.success) {
        setTemplates(templatesRes.data || [])
      }
      
      if (definitionsRes.success) {
        setWorkflowDefinitions(definitionsRes.data || [])
      }
    } catch (error) {
      console.error('加载数据失败', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await formApi.deleteTemplate(deleteTarget.id)
      if (res.success) {
        setTemplates(prev => prev.filter(t => t.id !== deleteTarget.id))
        setDeleteTarget(null)
        setShowDeleteDialog(false)
      } else {
        alert(res.error || '删除失败')
      }
    } catch (error) {
      console.error('删除失败', error)
      alert('删除失败')
    }
  }

  const handleCopy = async (template: FormTemplate) => {
    try {
      const res = await formApi.copyTemplate(template.id)
      if (res.success) {
        await loadData()
      } else {
        alert(res.error || '复制失败')
      }
    } catch (error) {
      console.error('复制失败', error)
      alert('复制失败')
    }
  }

  const getBoundWorkflows = (templateId: string) => {
    return workflowDefinitions.filter(wf => wf.form_template_id === templateId)
  }

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchKeyword.toLowerCase())
  )

  const getLayoutTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'single': '单列布局',
      'tabs': '标签页布局',
      'steps': '分步布局'
    }
    return labels[type] || type
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-700">表单模板</h1>
            <p className="text-gray-500 mt-1">共 {templates.length} 个模板</p>
          </div>
          <button
            onClick={() => navigate('/forms/designer/new')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            创建模板
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索模板..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-4">暂无表单模板</p>
            <button
              onClick={() => navigate('/forms/designer/new')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              创建第一个模板
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTemplates.map(template => {
              const boundWorkflows = getBoundWorkflows(template.id)
              
              return (
                <div key={template.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                        <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700">
                          v{template.version}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <Layout className="w-4 h-4" />
                          <span>{getLayoutTypeLabel(template.layout?.type || 'single')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Layers className="w-4 h-4" />
                          <span>{template.fields?.length || 0} 个字段</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          <span>{template.layout?.columns || 1} 列布局</span>
                        </div>
                      </div>

                      {boundWorkflows.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">关联工作流：</span>
                          {boundWorkflows.map(wf => (
                            <span
                              key={wf.id}
                              className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600"
                            >
                              {wf.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/forms/designer/${template.id}`)}
                        className="p-2 text-gray-400 hover:text-blue-600"
                        title="编辑"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCopy(template)}
                        className="p-2 text-gray-400 hover:text-green-600"
                        title="复制"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteDialog(true)}
                        className="p-2 text-gray-400 hover:text-red-600"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showDeleteDialog && deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">确认删除</h3>
            <p className="text-gray-600 mb-6">
              确定要删除模板 "{deleteTarget.name}" 吗？此操作不可恢复。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FormTemplatesPage
