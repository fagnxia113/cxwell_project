import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import UnifiedWorkflowDesigner from '../../components/UnifiedWorkflowDesigner'
import { ReactFlowProvider } from 'reactflow'
import { UnifiedWorkflowData, WorkflowVariable } from '../../types/workflow-designer'
import { API_URL } from '../../config/api'
import { apiClient } from '../../utils/apiClient'
import { workflowApi } from '../../api/workflowApi'
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
      const data = await apiClient.get<any>('/api/form/templates')
      if (data.success) {
        setFormTemplates(data.data || [])
      }
    } catch (error) {
      console.error('Failed to load form templates:', error)
    }
  }

  const loadDefinition = async (definitionId: string) => {
    try {
      setLoading(true);
      const res = await workflowApi.getDefinitionDetail(definitionId);
      if (res && res.success) {
        const { definition: def, nodes: rawNodes, skips: rawSkips } = res.data;
        
        setDefinition(def);
        setWorkflowName(def.flowName);
        setWorkflowKey(def.flowCode);
        setWorkflowCategory(def.category || 'general');

        // 将后端 7 表物理存储重建为 ReactFlow 逻辑格式
        const nodeTypeMap: Record<number, string> = {
          0: 'startEvent',
          1: 'userTask',
          2: 'endEvent',
          3: 'exclusiveGateway'
        };

        const adaptedNodes = rawNodes.map((n: any) => ({
          id: n.nodeCode,
          type: nodeTypeMap[n.nodeType] || 'userTask',
          position: n.coordinate ? JSON.parse(n.coordinate) : { x: 100, y: 100 },
          data: { label: n.nodeName }
        }));

        const adaptedEdges = rawSkips.map((s: any) => ({
          id: `edge_${s.nowNodeCode}_${s.nextNodeCode}`,
          source: s.nowNodeCode,
          target: s.nextNodeCode,
          type: 'smoothstep',
          animated: true,
          label: s.skipName,
          data: { condition: s.skipCondition }
        }));

        setWorkflowData({
          nodes: adaptedNodes,
          edges: adaptedEdges,
          variables: [],
          formSchema: []
        });
      }
    } catch (error: any) {
      console.error('Failed to load workflow definition:', error);
      showError('加载流程详情失败');
    } finally {
      setLoading(false);
    }
  };

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
      
      const nodeTypeMap: Record<string, number> = {
        'startEvent': 0,
        'endEvent': 2,
        'userTask': 1,
        'serviceTask': 1, // 目前统一映射为中间节点
        'exclusiveGateway': 3,
        'parallelGateway': 3
      }
      
      // 适配 7 表物理结构的 payload
      const payload = {
        nodes: workflowData.nodes.map((node: any) => ({
          nodeCode: node.id,
          nodeName: node.name || node.label,
          nodeType: nodeTypeMap[node.type] || 1,
          coordinate: JSON.stringify(node.position),
          // 若依/Warm-Flow 风格的权限标识
          permissionFlag: node.approvalConfig?.approverSource?.value || '' 
        })),
        skips: workflowData.edges.map((edge: any) => ({
          nowNodeCode: edge.source,
          nextNodeCode: edge.target,
          skipName: edge.label || '',
          skipCondition: edge.condition || '',
          coordinate: '' // 连线坐标可选
        }))
      }

      // 如果是新创建，先调 create 接口，获取 ID 后再 saveDesign
      let targetId = id;
      if (!targetId) {
        const createRes = await workflowApi.createDefinition({
          flowCode: workflowKey,
          flowName: workflowName,
          category: workflowCategory,
          version: '1.0'
        });
        if (createRes.success) {
          targetId = createRes.data.id;
        } else {
          throw new Error('创建流程定义失败');
        }
      }

      const saveRes = await workflowApi.saveDesign(targetId!, payload);
      
      if (saveRes.success) {
        success('工作流引擎保存成功');
        setShowSaveDialog(false);
        navigate('/workflow/definitions');
      }
    } catch (error: any) {
      console.error('Failed to save workflow:', error);
      showError(error.message || '保存失败');
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
        <ReactFlowProvider>
          <UnifiedWorkflowDesigner
            initialNodes={workflowData?.nodes?.length ? workflowData.nodes : initialNodes}
            initialEdges={workflowData?.edges?.length ? workflowData.edges : initialEdges}
            initialVariables={workflowData?.variables || initialVariables}
            initialFormSchema={workflowData?.formSchema || initialFormSchema}
            onSave={handleSave}
            onExport={handleExport}
          />
        </ReactFlowProvider>
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
