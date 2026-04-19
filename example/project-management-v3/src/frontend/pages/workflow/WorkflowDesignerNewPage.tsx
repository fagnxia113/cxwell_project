import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import UnifiedWorkflowDesigner from '../../components/UnifiedWorkflowDesigner'
import { UnifiedWorkflowData, WorkflowVariable } from '../../types/workflow-designer'
import { API_URL } from '../../config/api'
import { apiClient } from '../../utils/apiClient'
import { useMessage } from '../../contexts/MessageContext'

interface WorkflowDefinition {
  id: string
  key: string
  name: string
  version: number
  category: string
  entity_type: string
  status: string
  node_config: any
  variables?: WorkflowVariable[]
  form_schema?: any[]
  form_template_id?: string
}

interface FormTemplate {
  id: string
  name: string
  version: number
  fields: any[]
}

export default function WorkflowDesignerNewPage() {
  const navigate = useNavigate()
  const { success, error: showError } = useMessage()
  const { id } = useParams<{ id: string }>()
  const [definition, setDefinition] = useState<WorkflowDefinition | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [workflowName, setWorkflowName] = useState('')
  const [workflowKey, setWorkflowKey] = useState('')
  const [workflowCategory, setWorkflowCategory] = useState('hr')
  const [formTemplateId, setFormTemplateId] = useState<string>('')
  const [formTemplates, setFormTemplates] = useState<FormTemplate[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [workflowData, setWorkflowData] = useState<UnifiedWorkflowData | null>(null)

  useEffect(() => {
    loadFormTemplates()
    if (id) {
      loadDefinition(id)
    }
  }, [id])

  const loadFormTemplates = async () => {
    try {
      const data = await apiClient.get(`${API_URL.BASE}/api/workflow/form-templates`)
      if (data.success) {
        setFormTemplates(data.data || [])
      }
    } catch (error) {
      console.error('Failed to load form templates:', error)
    }
  }

  const loadDefinition = async (definitionId: string) => {
    try {
      setLoading(true)
      const data = await apiClient.get(`${API_URL.BASE}/api/workflow/definitions/${definitionId}`)
      if (data.success) {
        setDefinition(data.data)
        setWorkflowName(data.data.name)
        setWorkflowKey(data.data.key)
        setWorkflowCategory(data.data.category || 'hr')
        setFormTemplateId(data.data.form_template_id || '')
      }
    } catch (error) {
      console.error('Failed to load workflow definition:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = (data: UnifiedWorkflowData) => {
    setWorkflowData(data)
    setShowSaveDialog(true)
  }

  const handleExport = (data: UnifiedWorkflowData) => {
    console.log('Exporting workflow data:', data)
  }

  const confirmSave = async () => {
    if (!workflowName || !workflowKey) {
      showError('请填写必填项')
      return
    }

    if (!workflowData) {
      showError('工作流数据为空')
      return
    }

    try {
      setSaving(true)
      
      const typeMap: Record<string, string> = {
        'startEvent': 'start',
        'endEvent': 'end',
        'userTask': 'approval',
        'serviceTask': 'service',
        'exclusiveGateway': 'exclusive',
        'parallelGateway': 'parallel'
      }
      
      const payload = {
        key: workflowKey,
        name: workflowName,
        category: workflowCategory,
        entity_type: workflowCategory,
        nodes: workflowData.nodes.map((node: any) => {
          const transformedNode: any = {
            id: node.id,
            type: typeMap[node.type] || node.type,
            name: node.name,
            position: node.position
          };
          
          if (node.approvalConfig || node.gatewayConfig || node.serviceConfig || node.formKey) {
            transformedNode.config = {
              ...(node.approvalConfig && { approvalConfig: node.approvalConfig }),
              ...(node.gatewayConfig && { gatewayConfig: node.gatewayConfig }),
              ...(node.serviceConfig && { serviceConfig: node.serviceConfig }),
              ...(node.formKey && { formKey: node.formKey })
            };
          }
          
          return transformedNode;
        }),
        edges: workflowData.edges,
        variables: workflowData.variables,
        form_schema: workflowData.formSchema,
        form_template_id: formTemplateId || undefined,
        created_by: 'admin'
      }

      const url = id 
        ? `${API_URL.BASE}/api/workflow/definitions/${id}`
        : `${API_URL.BASE}/api/workflow/definitions`
      
      const data = id 
        ? await apiClient.put(url, payload)
        : await apiClient.post(url, payload)
      
      if (data.success) {
        success('保存成功')
        setShowSaveDialog(false)
        navigate('/workflow/definitions')
      }
    } catch (error) {
      console.error('Failed to save workflow:', error)
      showError('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const initialNodes = definition?.node_config?.nodes?.map((node: any) => {
    const typeMap: Record<string, string> = {
      'start': 'startEvent',
      'end': 'endEvent',
      'approval': 'userTask',
      'service': 'serviceTask',
      'exclusive': 'exclusiveGateway',
      'parallel': 'parallelGateway'
    }
    
    const transformedNode = {
      id: node.id,
      type: typeMap[node.type] || node.type || 'userTask',
      position: node.position || { x: 100 + Math.random() * 300, y: 100 + Math.random() * 200 },
      data: {
        label: node.name || node.data?.label,
        description: node.description || node.data?.description,
        approvalConfig: node.approvalConfig || node.config?.approvalConfig || node.data?.approvalConfig,
        gatewayConfig: node.gatewayConfig || node.config?.gatewayConfig || node.data?.gatewayConfig,
        serviceConfig: node.serviceConfig || node.config?.serviceConfig || node.data?.serviceConfig,
        formKey: node.formKey || node.config?.formKey || node.data?.formKey
      }
    };
    
    return transformedNode;
  }) || [
    {
      id: 'start',
      type: 'startEvent',
      position: { x: 100, y: 200 },
      data: { label: '开始' }
    }
  ]

  const initialEdges = definition?.node_config?.edges?.map((edge: any) => ({
    id: edge.id || `edge_${edge.source}_${edge.target}`,
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    animated: true,
    data: { condition: edge.condition }
  })) || []

  const initialVariables = definition?.variables || []
  const initialFormSchema = definition?.form_schema || []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-gray-50 z-20">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-700">
              {id ? '编辑工作流' : '新建工作流'}
            </h1>
            <p className="text-gray-500 mt-1">
              设计工作流的节点和表单
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/workflow/definitions')}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              返回列表
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden min-h-0">
        <UnifiedWorkflowDesigner
          initialNodes={initialNodes}
          initialEdges={initialEdges}
          initialVariables={initialVariables}
          initialFormSchema={initialFormSchema}
          onSave={handleSave}
          onExport={handleExport}
        />
      </div>

      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full m-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">保存工作流</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  工作流名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="工作流名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  工作流KEY <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={workflowKey}
                  onChange={(e) => setWorkflowKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. personnel_onboard"
                  disabled={!!id}
                />
                <p className="mt-1 text-xs text-gray-500">
                  用于系统识别的唯一标识
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  工作流分类
                </label>
                <select
                  value={workflowCategory}
                  onChange={(e) => setWorkflowCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="hr">人事管理</option>
                  <option value="equipment">设备管理</option>
                  <option value="project">项目管理</option>
                  <option value="purchase">采购管理</option>
                  <option value="task">任务管理</option>
                  <option value="general">通用</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  绑定表单模板
                </label>
                <select
                  value={formTemplateId}
                  onChange={(e) => setFormTemplateId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">不绑定模板</option>
                  {formTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} (v{template.version}) - {template.fields.length} 字段
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  选择表单模板以快速生成表单字段
                </p>
              </div>
              
              {workflowData && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="text-sm font-medium text-gray-700">工作流统计</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-600">节点数: <span className="font-medium text-gray-900">{workflowData.nodes.length}</span></div>
                    <div className="text-gray-600">连线数: <span className="font-medium text-gray-900">{workflowData.edges.length}</span></div>
                    <div className="text-gray-600">变量数: <span className="font-medium text-gray-900">{workflowData.variables.length}</span></div>
                    <div className="text-gray-600">审批节点: <span className="font-medium text-gray-900">
                      {workflowData.nodes.filter((n: any) => n.type === 'userTask').length}
                    </span></div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? '保存中...' : '确认'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
