import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Connection,
  useNodesState,
  useEdgesState,
  MarkerType,
  NodeTypes,
  Panel,
  useReactFlow
} from 'reactflow'
import 'reactflow/dist/style.css'
import {
  FileText,
  Users,
  GitBranch,
  Play,
  Square,
  LayoutGrid,
  Zap,
  Settings,
  Plus,
  Trash,
  Settings2,
  Save,
  ArrowRight,
  CheckSquare,
  X,
  ListOrdered,
  Vote,
  CheckCircle,
  Search,
  User
} from 'lucide-react'
import { API_URL, API_BASE_URL } from '../config/api'

import { 
  UnifiedWorkflowDesignerProps, 
  WorkflowVariable, 
  FormField, 
  WorkflowNodeData,
  UnifiedWorkflowData,
  ApprovalConfig,
  ApproverSource,
  GatewayConfig,
  GatewayCondition,
  ServiceTaskConfig
} from '../types/workflow-designer'
import { StartEventNode, EndEventNode } from './workflow/nodes/StartEndNodes'
import { UserTaskNode, ServiceTaskNode } from './workflow/nodes/TaskNodes'
import { ExclusiveGatewayNode, ParallelGatewayNode } from './workflow/nodes/GatewayNodes'

const defaultNodeTypes: NodeTypes = {
  startEvent: StartEventNode,
  endEvent: EndEventNode,
  userTask: UserTaskNode,
  serviceTask: ServiceTaskNode,
  exclusiveGateway: ExclusiveGatewayNode,
  parallelGateway: ParallelGatewayNode
}

const defaultEdgeTypes = {}

export const UnifiedWorkflowDesigner: React.FC<UnifiedWorkflowDesignerProps> = ({
  initialNodes = [],
  initialEdges = [],
  initialVariables = [],
  initialFormSchema = [],
  onSave,
  onExport,
  readOnly = false
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [variables, setVariables] = useState<WorkflowVariable[]>(initialVariables)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null)
  const [activePanel, setActivePanel] = useState<'nodes' | 'variables'>('nodes')
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition, setViewport } = useReactFlow()

  const onConnect = useCallback(
    (params: Connection) => {
      const edge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#3b82f6'
        }
      }
      setEdges((eds) => addEdge(edge, eds))
    },
    [setEdges]
  )

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
    setSelectedEdge(null)
  }, [])

  const onEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge)
    setSelectedNode(null)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
    setSelectedEdge(null)
  }, [])

  const getDefaultNodeData = (type: string): WorkflowNodeData => {
    switch (type) {
      case 'startEvent':
        return { label: '开始' }
      case 'endEvent':
        return { label: '结束' }
      case 'userTask':
        return { label: '审批', approvalConfig: { approvalMode: 'or_sign', approverSource: { type: 'role' } } }
      case 'serviceTask':
        return { label: '服务', serviceConfig: { serviceType: 'http', serviceConfig: {} } }
      case 'exclusiveGateway':
        return { label: '排他网关', gatewayConfig: { type: 'exclusive', conditions: [] } }
      case 'parallelGateway':
        return { label: '并行网关', gatewayConfig: { type: 'parallel' } }
      default:
        return { label: '节点' }
    }
  }

  const addNode = useCallback((type: string, position: { x: number; y: number }) => {
    const newNode: Node = {
      id: `${type}_${Date.now()}`,
      type,
      position,
      data: getDefaultNodeData(type)
    }
    setNodes((nds) => [...nds, newNode])
  }, [setNodes])

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow')
      if (typeof type === 'undefined' || !type) return

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      
      addNode(type, position)
    },
    [screenToFlowPosition, addNode]
  )

  const deleteSelectedNode = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id))
      setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id))
      setSelectedNode(null)
    }
  }, [selectedNode, setNodes, setEdges])

  const deleteSelectedEdge = useCallback(() => {
    if (selectedEdge) {
      setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id))
      setSelectedEdge(null)
    }
  }, [selectedEdge, setEdges])

  const onAutoLayout = useCallback(() => {
    const nodeWidth = 200;
    const nodeHeight = 80;
    const horizontalSpacing = 150;
    const verticalSpacing = 120;

    // 1. 构建邻接表和入度表
    const adj = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    nodes.forEach(n => {
      adj.set(n.id, []);
      inDegree.set(n.id, 0);
    });
    edges.forEach(e => {
      adj.get(e.source)?.push(e.target);
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    });

    // 2. 拓扑排序计算层级 (处理非 DAG 场景：使用简单 BFS 层级限制)
    const levels: Map<string, number> = new Map();
    const queue: [string, number][] = [];
    
    // 找出所有入度为 0 的节点作为起点
    nodes.filter(n => (inDegree.get(n.id) || 0) === 0).forEach(n => {
      queue.push([n.id, 0]);
      levels.set(n.id, 0);
    });

    // 如果没有入度为 0 的节点（纯环路），强制将第一个节点作为起点
    if (queue.length === 0 && nodes.length > 0) {
      queue.push([nodes[0].id, 0]);
      levels.set(nodes[0].id, 0);
    }

    const processed = new Set<string>();
    while (queue.length > 0) {
      const [u, d] = queue.shift()!;
      if (processed.has(u)) continue;
      processed.add(u);

      (adj.get(u) || []).forEach(v => {
        const nextDist = Math.max(levels.get(v) || 0, d + 1);
        levels.set(v, nextDist);
        queue.push([v, nextDist]);
      });
    }

    // 处理未访问到的孤立节点
    nodes.forEach(n => {
      if (!levels.has(n.id)) levels.set(n.id, 0);
    });

    // 3. 将层级汇总为数组
    const levelMap: Record<number, string[]> = {};
    levels.forEach((lvl, id) => {
      if (!levelMap[lvl]) levelMap[lvl] = [];
      levelMap[lvl].push(id);
    });

    const maxLevel = Math.max(...Object.keys(levelMap).map(Number));

    // 4. 计算坐标
    const positionedNodes = nodes.map(node => {
      const lvl = levels.get(node.id) || 0;
      const nodesInThisLevel = levelMap[lvl];
      const indexInLevel = nodesInThisLevel.indexOf(node.id);
      
      // 水平居中计算
      const levelTotalWidth = nodesInThisLevel.length * nodeWidth + (nodesInThisLevel.length - 1) * horizontalSpacing;
      const startX = (1000 - levelTotalWidth) / 2; // 假设容器宽 1000

      return {
        ...node,
        position: {
          x: startX + indexInLevel * (nodeWidth + horizontalSpacing),
          y: 50 + lvl * (nodeHeight + verticalSpacing)
        }
      };
    });

    setNodes(positionedNodes);
    // 自动重置视角
    setTimeout(() => {
         setViewport({ x: 0, y: 0, zoom: 0.8 }, { duration: 800 });
    }, 100);
  }, [nodes, edges, setNodes, setViewport])

  const updateNodeData = useCallback((key: string, value: any) => {
    if (selectedNode) {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === selectedNode.id) {
            return {
              ...node,
              data: {
                ...node.data,
                [key]: value
              }
            }
          }
          return node
        })
      )
      setSelectedNode((prev) =>
        prev ? { ...prev, data: { ...prev.data, [key]: value } } : null
      )
    }
  }, [selectedNode, setNodes])

  const handleSave = useCallback(() => {
    const workflowData: UnifiedWorkflowData = {
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type || 'userTask',
        name: node.data.label,
        position: node.position,
        approvalConfig: node.data.approvalConfig,
        gatewayConfig: node.data.gatewayConfig,
        serviceConfig: node.data.serviceConfig,
        formKey: node.data.formKey
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        condition: edge.data?.condition
      })),
      variables,
      formSchema: []
    }
    onSave?.(workflowData)
    onExport?.(workflowData)
  }, [nodes, edges, variables, onSave, onExport])

  const addVariable = useCallback(() => {
    const newVar: WorkflowVariable = {
      name: `var_${variables.length + 1}`,
      type: 'string',
      required: false
    }
    setVariables([...variables, newVar])
  }, [variables])

  const updateVariable = useCallback((index: number, field: keyof WorkflowVariable, value: any) => {
    const newVars = [...variables]
    newVars[index] = { ...newVars[index], [field]: value }
    setVariables(newVars)
  }, [variables])

  const removeVariable = useCallback((index: number) => {
    setVariables(variables.filter((_, i) => i !== index))
  }, [variables])

  const fieldTypeLabels: Record<string, string> = {
    text: '文本输入',
    number: '数字输入',
    date: '日期选择',
    select: '下拉选择',
    textarea: '多行文本',
    user: '用户选择',
    boolean: '开关',
    lookup: '查找引用',
    reference: '关联字段'
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-50 overflow-hidden font-sans">
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 pt-2">
        <div className="flex items-center gap-8">
          <div className="pb-3 text-sm font-semibold tracking-wide transition-all border-b-2 border-blue-600 text-blue-600">
            工作流设计
          </div>

          <div className="ml-auto flex items-center gap-3 pb-3">
            <button
              onClick={onAutoLayout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-200 transition-all"
            >
              <LayoutGrid className="w-4 h-4" />
              一键排版
            </button>
            <button
              onClick={handleSave}
              disabled={readOnly}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              保存引擎
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="w-full h-full flex min-h-0">
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 shadow-sm z-10">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActivePanel('nodes')}
                  className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all ${activePanel === 'nodes' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  节点列表
                </button>
                <button
                  onClick={() => setActivePanel('variables')}
                  className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all ${activePanel === 'variables' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  变量
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {activePanel === 'nodes' ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        事件节点
                      </h3>
                      <div className="space-y-2">
                        {[
                          { type: 'startEvent', label: '开始', icon: Play, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                          { type: 'endEvent', label: '结束', icon: Square, color: 'text-rose-500', bg: 'bg-rose-50' }
                        ].map(node => (
                          <div
                            key={node.type}
                            className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl cursor-grab active:cursor-grabbing hover:border-blue-200 hover:shadow-md transition-all group"
                            onDragStart={(e) => onDragStart(e, node.type)}
                            draggable
                          >
                            <div className={`w-8 h-8 rounded-lg ${node.bg} ${node.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                              <node.icon className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-gray-700">{node.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        任务节点
                      </h3>
                      <div className="space-y-2">
                        {[
                          { type: 'userTask', label: '审批', icon: CheckSquare, color: 'text-blue-500', bg: 'bg-blue-50' },
                          { type: 'serviceTask', label: '服务', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' }
                        ].map(node => (
                          <div
                            key={node.type}
                            className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl cursor-grab active:cursor-grabbing hover:border-blue-200 hover:shadow-md transition-all group"
                            onDragStart={(e) => onDragStart(e, node.type)}
                            onClick={() => addNode(node.type, { x: 250, y: 150 })}
                            draggable
                          >
                            <div className={`w-8 h-8 rounded-lg ${node.bg} ${node.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                              <node.icon className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-gray-700">{node.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        网关节点
                      </h3>
                      <div className="space-y-2">
                        {[
                          { type: 'exclusiveGateway', label: '排他网关', icon: GitBranch, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                          { type: 'parallelGateway', label: '并行网关', icon: LayoutGrid, color: 'text-purple-500', bg: 'bg-purple-50' }
                        ].map(node => (
                          <div
                            key={node.type}
                            className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl cursor-grab active:cursor-grabbing hover:border-blue-200 hover:shadow-md transition-all group"
                            onDragStart={(e) => onDragStart(e, node.type)}
                            onClick={() => addNode(node.type, { x: 250, y: 150 })}
                            draggable
                          >
                            <div className={`w-8 h-8 rounded-lg ${node.bg} ${node.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                              <node.icon className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-bold text-gray-700">{node.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                      <h4 className="text-xs font-black text-blue-700 uppercase tracking-widest mb-1">变量</h4>
                      <p className="text-[11px] text-blue-600/70 font-medium leading-relaxed">定义工作流中使用的变量</p>
                    </div>
                    
                    <button
                      onClick={addVariable}
                      disabled={readOnly}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-dashed border-gray-200 text-gray-500 rounded-xl text-xs font-black uppercase tracking-widest hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      添加变量
                    </button>

                    <div className="space-y-3">
                      {variables.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                          暂无变量
                        </div>
                      ) : (
                        variables.map((variable, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={variable.name}
                                onChange={(e) => updateVariable(index, 'name', e.target.value)}
                                disabled={readOnly}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="变量名"
                              />
                              <button
                                onClick={() => removeVariable(index)}
                                disabled={readOnly}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <select
                              value={variable.type}
                              onChange={(e) => updateVariable(index, 'type', e.target.value)}
                              disabled={readOnly}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="string">字符串</option>
                              <option value="number">数字</option>
                              <option value="boolean">布尔值</option>
                              <option value="date">日期</option>
                              <option value="object">对象</option>
                              <option value="array">数组</option>
                            </select>
                            <input
                              type="text"
                              value={variable.description || ''}
                              onChange={(e) => updateVariable(index, 'description', e.target.value)}
                              disabled={readOnly}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="描述"
                            />
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={variable.required || false}
                                onChange={(e) => updateVariable(index, 'required', e.target.checked)}
                                disabled={readOnly}
                                className="rounded"
                              />
                              必填
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 relative min-w-0">
              <ReactFlow
                ref={reactFlowWrapper}
                nodes={nodes}
                edges={edges.map(e => ({
                  ...e,
                  style: selectedEdge?.id === e.id
                    ? { stroke: '#ef4444', strokeWidth: 3 }
                    : { stroke: '#3b82f6', strokeWidth: 2 },
                  animated: selectedEdge?.id === e.id ? false : true
                }))}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                onPaneClick={onPaneClick}
                onDragOver={onDragOver}
                onDrop={onDrop}
                nodeTypes={defaultNodeTypes}
                edgeTypes={defaultEdgeTypes}
                deleteKeyCode="Delete"
                fitView
                attributionPosition="bottom-left"
              >
                <Background color="#f1f5f9" gap={16} />
                <Controls />
                <MiniMap />
              </ReactFlow>
            </div>

            {selectedNode ? (
              <div className="w-80 bg-white border-l border-gray-200 flex flex-col flex-shrink-0 shadow-xl z-20">
                <NodeConfigPanel
                  node={selectedNode}
                  onUpdate={updateNodeData}
                  onDelete={deleteSelectedNode}
                  readOnly={readOnly}
                />
              </div>
            ) : selectedEdge ? (
              <div className="w-80 bg-white border-l border-gray-200 flex flex-col flex-shrink-0 shadow-xl z-20">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">连线信息</h3>
                    <button
                      onClick={deleteSelectedEdge}
                      disabled={readOnly}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-all disabled:opacity-50"
                    >
                      <Trash className="w-3.5 h-3.5" />
                      删除连线
                    </button>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">连线ID</label>
                    <p className="text-sm text-gray-700 font-medium break-all">{selectedEdge.id}</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">起始节点</label>
                    <p className="text-sm text-gray-700 font-medium">{nodes.find(n => n.id === selectedEdge.source)?.data?.label || selectedEdge.source}</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">目标节点</label>
                    <p className="text-sm text-gray-700 font-medium">{nodes.find(n => n.id === selectedEdge.target)?.data?.label || selectedEdge.target}</p>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <p className="text-[11px] text-amber-700 font-medium">点击"删除连线"按钮或选中连线后按 Delete 键可删除此连线</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-80 bg-white border-l border-gray-200 flex flex-col flex-shrink-0 p-8 items-center justify-center text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Settings2 className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-400 text-sm font-medium">请选择一个节点进行配置</p>
              </div>
            )}
        </div>
      </div>
    </div>
  )
}

interface NodeConfigPanelProps {
  node: Node
  onUpdate: (key: string, value: any) => void
  onDelete?: () => void
  readOnly?: boolean
}

interface Employee {
  id: string
  name: string
  employeeNo: string
  position?: string
  department?: string
  department_name?: string
  email?: string
  phone?: string
}

interface EmployeeSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (selectedIds: string[]) => void
  initialSelectedIds: string[]
  positions?: Record<string, string>
  departments?: Record<string, string>
}

const EmployeeSelectorModal: React.FC<EmployeeSelectorModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialSelectedIds,
  positions = {},
  departments = {}
}) => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadEmployees()
      setSelectedIds(initialSelectedIds)
    }
  }, [isOpen, initialSelectedIds])

  const loadEmployees = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/organization/employee/list?page=1&pageSize=1000`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      })
      const result = await response.json()
      const rawList = result.data?.list || result.data || []
      const mapped = (Array.isArray(rawList) ? rawList : []).map((emp: any) => ({
        id: emp.employeeId?.toString() || emp.id?.toString() || '',
        name: emp.name || emp.employeeName || emp.userName || '',
        employeeNo: emp.employeeNo || emp.empNo || '',
        position: emp.position || emp.postName || '',
        department: emp.department || emp.deptName || '',
        department_name: emp.department_name || emp.deptName || '',
        email: emp.email || '',
        phone: emp.phone || emp.mobile || '',
      }))
      setEmployees(mapped)
    } catch (error) {
      console.error('Failed to load employee list:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEmployees = employees.filter(emp =>
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const handleConfirm = () => {
    onConfirm(selectedIds)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[600px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">选择人员</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索姓名、工号或职位..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {selectedIds.length > 0 ? (
              <div className="space-y-1">
                <div>已选 {selectedIds.length} 项</div>
                <div className="text-xs text-blue-600">
                  {selectedIds.map(id => {
                    const emp = employees.find(e => e.id === id)
                    if (!emp) return id
                    const name = emp.name || '未知'

                    let position = emp.position || '未分配职位'
                    if (position.includes('-') || position.length > 20) {
                      position = positions[position] || '未分配职位'
                    }

                    let department = emp.department || emp.department_name || '未分配部门'
                    if (department.includes('-') || department.length > 20) {
                      department = departments[department] || '未分配部门'
                    }

                    return `${name} (${position} - ${department})`
                  }).join(', ')}
                </div>
              </div>
            ) : (
              <div>已选 0 项</div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无数据</div>
          ) : (
            <div className="space-y-2">
              {filteredEmployees.map(employee => (
                <div
                  key={employee.id}
                  onClick={() => toggleSelection(employee.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedIds.includes(employee.id)
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedIds.includes(employee.id)
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedIds.includes(employee.id) && (
                      <CheckCircle className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{employee.name}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {(() => {
                        let pos = employee.position || '未分配职位'
                        if (pos.includes('-') || pos.length > 20) {
                          pos = positions[pos] || '未分配职位'
                        }
                        return pos
                      })()} {(() => {
                        let dept = employee.department || employee.department_name || '未分配部门'
                        if (dept.includes('-') || dept.length > 20) {
                          dept = departments[dept] || '未分配部门'
                        }
                        return dept ? `- ${dept}` : ''
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            确认选择 ({selectedIds.length})
          </button>
        </div>
      </div>
    </div>
  )
}

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({ node, onUpdate, onDelete, readOnly }) => {
  const [activeSection, setActiveSection] = useState<'basic' | 'approval' | 'gateway' | 'service'>('basic')
  const [showEmployeeSelector, setShowEmployeeSelector] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [positions, setPositions] = useState<Record<string, string>>({})
  const [departments, setDepartments] = useState<Record<string, string>>({})

  useEffect(() => {
    loadEmployees()
    loadPositions()
    loadDepartments()
  }, [])

  const loadEmployees = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/organization/employee/list?page=1&pageSize=1000`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      })
      const result = await response.json()
      const rawList = result.data?.list || result.data || []
      const mapped = (Array.isArray(rawList) ? rawList : []).map((emp: any) => ({
        id: emp.employeeId?.toString() || emp.id?.toString() || '',
        name: emp.name || emp.employeeName || emp.userName || '',
        employeeNo: emp.employeeNo || emp.empNo || '',
        position: emp.position || emp.postName || '',
        department: emp.department || emp.deptName || '',
        department_name: emp.department_name || emp.deptName || '',
        email: emp.email || '',
        phone: emp.phone || emp.mobile || '',
      }))
      setEmployees(mapped)
    } catch (error) {
      console.error('Failed to load employee list:', error)
    }
  }

  const loadPositions = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL.ORGANIZATION.POSITIONS}?page=1&pageSize=1000`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      })
      const result = await response.json()
      const posMap: Record<string, string> = {}
      if (result.data) {
        result.data.forEach((pos: any) => {
          posMap[pos.id] = pos.name
        })
      }
      setPositions(posMap)
    } catch (error) {
      console.error('Failed to load positions:', error)
    }
  }

  const loadDepartments = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL.ORGANIZATION.DEPARTMENTS}?page=1&pageSize=1000`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      })
      const result = await response.json()
      const deptMap: Record<string, string> = {}
      if (result.data) {
        result.data.forEach((dept: any) => {
          deptMap[dept.id] = dept.name
        })
      }
      setDepartments(deptMap)
    } catch (error) {
      console.error('Failed to load departments:', error)
    }
  }

  const getSelectedEmployeeNames = (employeeIds: string): string => {
    if (!employeeIds) return ''
    const ids = employeeIds.split(',').filter(Boolean)
    
    if (employees.length === 0) {
      return `已选 ${ids.length} 项`
    }
    
    const details = ids.map(id => {
      const emp = employees.find(e => e.id === id)
      if (!emp) return id
      
      const name = emp.name || '未知'
      
      let position = emp.position || '未分配职位'
      if (position.includes('-') || position.length > 20) {
        position = positions[position] || '未分配职位'
      }
      
      let department = emp.department || emp.department_name || '未分配部门'
      if (department.includes('-') || department.length > 20) {
        department = departments[department] || '未分配部门'
      }
      
      return `${name} (${position} - ${department})`
    })
    
    const result = details.join('、')
    
    if (result.includes('${') || result.includes('formData.')) {
      return `已选 ${ids.length} 项`
    }
    
    return result
  }

  const renderBasicConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">节点名称</label>
        <input
          type="text"
          value={node.data.label || ''}
          onChange={(e) => onUpdate('label', e.target.value)}
          disabled={readOnly}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          placeholder="节点名称"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">节点描述</label>
        <textarea
          value={node.data.description || ''}
          onChange={(e) => onUpdate('description', e.target.value)}
          disabled={readOnly}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          rows={3}
          placeholder="节点描述"
        />
      </div>

      {node.type === 'userTask' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">表单KEY</label>
          <input
            type="text"
            value={node.data.formKey || ''}
            onChange={(e) => onUpdate('formKey', e.target.value)}
            disabled={readOnly}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="表单KEY"
          />
        </div>
      )}
    </div>
  )

  const renderApprovalConfig = () => {
    const config: ApprovalConfig = node.data.approvalConfig || {
      approvalMode: 'or_sign',
      approverSource: { type: 'role' }
    }

    const updateConfig = (key: keyof ApprovalConfig, value: any) => {
      onUpdate('approvalConfig', { ...config, [key]: value })
    }

    const updateApproverSource = (key: keyof ApproverSource, value: any) => {
      const updates: Partial<ApproverSource> = { [key]: value }
      
      if (key === 'type') {
        updates.value = ''
      }
      
      onUpdate('approvalConfig', {
        ...config,
        approverSource: { ...config.approverSource, ...updates }
      })
    }

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">审批方式</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'or_sign', label: '或签', icon: CheckSquare, desc: '任一审批人通过即可' },
              { value: 'and_sign', label: '会签', icon: Users, desc: '所有审批人需全部通过' },
              { value: 'sequential', label: '依次审批', icon: ListOrdered, desc: '按顺序依次审批' },
              { value: 'vote', label: '投票', icon: Vote, desc: '多数通过即可' }
            ].map((mode) => (
              <button
                key={mode.value}
                onClick={() => updateConfig('approvalMode', mode.value)}
                disabled={readOnly}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                  config.approvalMode === mode.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <mode.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{mode.label}</span>
                <span className="text-xs text-gray-500">{mode.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {config.approvalMode === 'vote' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">投票阈值</label>
            <input
              type="number"
              min={1}
              value={config.voteThreshold || 1}
              onChange={(e) => updateConfig('voteThreshold', parseInt(e.target.value))}
              disabled={readOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500">设置审批人通过票数占总人数的比例</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">审批人来源</label>
          <select
            value={config.approverSource?.type || 'role'}
            onChange={(e) => updateApproverSource('type', e.target.value)}
            disabled={readOnly}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="role">角色</option>
            <option value="user">指定人员</option>
            <option value="department_manager">部门负责人</option>
            <option value="project_manager">项目经理</option>
            <option value="initiator">发起人</option>
            <option value="form_field">表单字段</option>
            <option value="expression">表达式</option>
          </select>
        </div>

        {config.approverSource?.type === 'role' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">审批角色</label>
            <select
              value={config.approverSource?.value || ''}
              onChange={(e) => updateApproverSource('value', e.target.value)}
              disabled={readOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">请选择角色</option>
              <option value="admin">系统管理员</option>
              <option value="project_manager">项目经理</option>
              <option value="hr_manager">人事经理</option>
              <option value="equipment_manager">设备管理员</option>
              <option value="finance_manager">财务经理</option>
              <option value="general_manager">总经理</option>
            </select>
          </div>
        )}

        {config.approverSource?.type === 'user' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">指定人员</label>
            <div className="space-y-2">
              <button
                onClick={() => setShowEmployeeSelector(true)}
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className={config.approverSource?.value ? 'text-gray-800' : 'text-gray-400'}>
                  {config.approverSource?.value
                    ? getSelectedEmployeeNames(config.approverSource.value)
                    : '点击选择用户'}
                </span>
                <Users className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <EmployeeSelectorModal
              isOpen={showEmployeeSelector}
              onClose={() => setShowEmployeeSelector(false)}
              onConfirm={(selectedIds) => updateApproverSource('value', selectedIds.join(','))}
              initialSelectedIds={config.approverSource?.value?.split(',').filter(Boolean) || []}
              positions={positions}
              departments={departments}
            />
          </div>
        )}

        {config.approverSource?.type === 'form_field' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">表单字段</label>
            <input
              type="text"
              value={config.approverSource?.value || ''}
              onChange={(e) => updateApproverSource('value', e.target.value)}
              disabled={readOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="请输入表单字段名"
            />
          </div>
        )}

        {config.approverSource?.type === 'expression' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">表达式</label>
            <input
              type="text"
              value={config.approverSource?.value || ''}
              onChange={(e) => updateApproverSource('value', e.target.value)}
              disabled={readOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              placeholder="请输入表达式"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">跳过条件</label>
          <select
            value={config.skipCondition || 'none'}
            onChange={(e) => updateConfig('skipCondition', e.target.value)}
            disabled={readOnly}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="none">无</option>
            <option value="no_approvers">审批人为空</option>
            <option value="always">始终跳过</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">超时时间(小时)</label>
          <input
            type="number"
            min={0}
            value={config.timeout || 0}
            onChange={(e) => updateConfig('timeout', parseInt(e.target.value))}
            disabled={readOnly}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <p className="mt-1 text-xs text-gray-500">设置审批超时时间</p>
        </div>

        {config.timeout && config.timeout > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">超时动作</label>
            <select
              value={config.timeoutAction || 'remind'}
              onChange={(e) => updateConfig('timeoutAction', e.target.value)}
              disabled={readOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="remind">催办</option>
              <option value="auto_pass">自动通过</option>
              <option value="auto_reject">自动拒绝</option>
            </select>
          </div>
        )}
      </div>
    )
  }

  const renderGatewayConfig = () => {
    const config: GatewayConfig = node.data.gatewayConfig || { type: 'exclusive' }

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">网关类型</label>
          <div className="flex gap-2">
            {[
              { value: 'exclusive', label: '排他网关', desc: '满足任一条件即执行该分支' },
              { value: 'parallel', label: '并行网关', desc: '所有分支同时执行' },
              { value: 'inclusive', label: '包容网关', desc: '满足条件的分支都会执行' }
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => onUpdate('gatewayConfig', { ...config, type: type.value })}
                disabled={readOnly}
                className={`flex-1 p-3 rounded-lg border-2 text-center transition-all ${
                  config.type === type.value
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-bold text-sm text-gray-800">{type.label}</div>
                <div className="text-[10px] text-gray-500 mt-1 leading-tight">{type.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {config.type === 'exclusive' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">分支条件</label>
            <div className="space-y-2">
              {(config.conditions || []).map((condition, index) => (
                <div key={condition.id} className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <input
                    type="text"
                    value={condition.name}
                    onChange={(e) => {
                      const newConditions = [...(config.conditions || [])]
                      newConditions[index] = { ...condition, name: e.target.value }
                      onUpdate('gatewayConfig', { ...config, conditions: newConditions })
                    }}
                    disabled={readOnly}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                    placeholder="条件名称"
                  />
                  <input
                    type="text"
                    value={condition.expression}
                    onChange={(e) => {
                      const newConditions = [...(config.conditions || [])]
                      newConditions[index] = { ...condition, expression: e.target.value }
                      onUpdate('gatewayConfig', { ...config, conditions: newConditions })
                    }}
                    disabled={readOnly}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none font-mono"
                    placeholder="请输入条件表达式"
                  />
                </div>
              ))}
              <button
                onClick={() => {
                  const newCondition: GatewayCondition = {
                    id: `cond_${Date.now()}`,
                    name: `条件${(config.conditions || []).length + 1}`,
                    expression: '',
                    targetNodeId: ''
                  }
                  onUpdate('gatewayConfig', {
                    ...config,
                    conditions: [...(config.conditions || []), newCondition]
                  })
                }}
                disabled={readOnly}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-bold"
              >
                <Plus className="w-4 h-4" />
                添加条件
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderServiceConfig = () => {
    const config: ServiceTaskConfig = node.data.serviceConfig || {
      serviceType: 'http',
      serviceConfig: {}
    }

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">服务类型</label>
          <select
            value={config.serviceType}
            onChange={(e) => onUpdate('serviceConfig', { ...config, serviceType: e.target.value })}
            disabled={readOnly}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="http">HTTP请求</option>
            <option value="script">脚本</option>
            <option value="email">发送邮件</option>
            <option value="notification">发送通知</option>
            <option value="custom">自定义</option>
          </select>
        </div>

        {config.serviceType === 'http' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">请求地址</label>
              <input
                type="text"
                value={config.serviceConfig?.url || ''}
                onChange={(e) => onUpdate('serviceConfig', {
                  ...config,
                  serviceConfig: { ...config.serviceConfig, url: e.target.value }
                })}
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="https://api.example.com/webhook"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">请求方法</label>
              <select
                value={config.serviceConfig?.method || 'POST'}
                onChange={(e) => onUpdate('serviceConfig', {
                  ...config,
                  serviceConfig: { ...config.serviceConfig, method: e.target.value }
                })}
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
          </>
        )}

        {config.serviceType === 'email' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">收件人</label>
              <input
                type="text"
                value={config.serviceConfig?.to || ''}
                onChange={(e) => onUpdate('serviceConfig', {
                  ...config,
                  serviceConfig: { ...config.serviceConfig, to: e.target.value }
                })}
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">邮件主题</label>
              <input
                type="text"
                value={config.serviceConfig?.subject || ''}
                onChange={(e) => onUpdate('serviceConfig', {
                  ...config,
                  serviceConfig: { ...config.serviceConfig, subject: e.target.value }
                })}
                disabled={readOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="输入通知内容..."
              />
            </div>
          </>
        )}
      </div>
    )
  }

  const sections: { key: typeof activeSection; label: string; icon: any; show: boolean }[] = [
    { key: 'basic', label: '基础配置', icon: Settings, show: true },
    { key: 'approval', label: '审批配置', icon: User, show: node.type === 'userTask' },
    { key: 'gateway', label: '网关配置', icon: GitBranch, show: !!node.type?.includes('Gateway') },
    { key: 'service', label: '服务配置', icon: Settings, show: node.type === 'serviceTask' }
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">节点配置</h3>
        {onDelete && !readOnly && (
          <button 
            onClick={onDelete} 
            className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
          >
            <Trash className="w-3 h-3" />
            删除
          </button>
        )}
      </div>

      <div className="flex border-b border-gray-200 overflow-x-auto">
        {sections.filter(s => s.show).map((section) => (
          <button
            key={section.key}
            onClick={() => setActiveSection(section.key)}
            className={`flex items-center gap-1 px-4 py-3 text-sm font-medium whitespace-nowrap ${
              activeSection === section.key
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <section.icon className="w-4 h-4" />
            {section.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeSection === 'basic' && renderBasicConfig()}
        {activeSection === 'approval' && renderApprovalConfig()}
        {activeSection === 'gateway' && renderGatewayConfig()}
        {activeSection === 'service' && renderServiceConfig()}
      </div>
    </div>
  )
}

export default UnifiedWorkflowDesigner
