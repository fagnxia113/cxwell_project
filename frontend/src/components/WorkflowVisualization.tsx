import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import ReactFlow, { 
  useNodesState, 
  useEdgesState, 
  Background, 
  Controls, 
  MiniMap, 
  ReactFlowProvider, 
  MarkerType 
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useTranslation } from 'react-i18next'
import { 
  Play, 
  Square, 
  CheckCircle, 
  Circle, 
  User,
  Clock,
  CheckSquare,
  XCircle,
  MoreHorizontal
} from 'lucide-react'

interface WorkflowVisualizationProps {
  instanceId: string
  definition: any
  tasks?: any[]
  onNodeClick?: (node: any) => void
}

const getNodeIcon = (type: string) => {
  switch (type) {
    case 'startEvent':
      return <Play className="w-5 h-5 text-green-500" />
    case 'endEvent':
      return <CheckSquare className="w-5 h-5 text-red-500" />
    case 'userTask':
      return <User className="w-5 h-5 text-blue-500" />
    case 'exclusiveGateway':
      return <XCircle className="w-5 h-5 text-orange-500" />
    case 'parallelGateway':
      return <MoreHorizontal className="w-5 h-5 text-purple-500" />
    case 'inclusiveGateway':
      return <MoreHorizontal className="w-5 h-5 text-indigo-500" />
    default:
      return <Circle className="w-5 h-5 text-gray-500" />
  }
}

const WorkflowVisualization: React.FC<WorkflowVisualizationProps> = ({ 
  instanceId, 
  definition, 
  tasks = [],
  onNodeClick 
}) => {

  const { t } = useTranslation()
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<any | null>(null)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const reactFlowInstance = useRef<any>(null)

  useEffect(() => {
    if (!definition?.node_config) return

    const { nodes: defNodes, edges: defEdges } = definition.node_config

    const completedTaskNodeIds = tasks
      .filter((task: any) => task.status === 'completed')
      .map((task: any) => task.node_id)

    const activeTask = tasks.find((task: any) => task.status === 'assigned' || task.status === 'in_progress')
    const currentTaskId = activeTask?.node_id

    const flowNodes = defNodes.map((node: any) => {
      const position = node.position || { x: 0, y: 0 }
      const isCurrent = node.id === currentTaskId
      const isCompleted = completedTaskNodeIds.includes(node.id)
      
      let status = 'idle'
      let statusColor = '#94a3b8'
      let statusIcon = null

      if (isCurrent) {
        status = 'current'
        statusColor = '#3b82f6'
        statusIcon = <Clock className="w-4 h-4 text-blue-500" />
      } else if (isCompleted) {
        status = 'completed'
        statusColor = '#10b981'
        statusIcon = <CheckCircle className="w-4 h-4 text-green-500" />
      } else {
        status = 'idle'
        statusColor = '#94a3b8'
        statusIcon = <Circle className="w-4 h-4 text-gray-400" />
      }

      return {
        id: node.id,
        type: 'customNode',
        position,
        data: {
          label: node.name,
          type: node.type,
          status,
          statusColor,
          statusIcon
        }
      }
    })

    const flowEdges = defEdges.map((edge: any) => {
      const sourceTask = tasks.find((task: any) => task.node_id === edge.source)
      const isEdgeActive = sourceTask?.status === 'completed' || sourceTask?.status === 'in_progress'

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'smoothstep',
        animated: isEdgeActive,
        style: {
          stroke: isEdgeActive ? '#3b82f6' : '#cbd5e1',
          strokeWidth: isEdgeActive ? 2 : 1.5
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isEdgeActive ? '#3b82f6' : '#cbd5e1'
        }
      }
    })

    setNodes(flowNodes)
    setEdges(flowEdges)
  }, [definition, tasks, instanceId])

  const onNodeMouseEnter = useCallback((event: any, node: any) => {
    setSelectedNode(node)
  }, [])

  const onNodeMouseLeave = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const handleNodeClick = useCallback((event: any, node: any) => {
    setSelectedNode(node)
    onNodeClick?.(node)
  }, [onNodeClick])

  const nodeTypes = useMemo(() => ({
    customNode: ({ data, selected }: any) => {
      const isSelected = selected
      const statusColor = data.statusColor || '#94a3b8'

      return (
        <div
          onMouseEnter={(e) => onNodeMouseEnter(e, { data, selected: true })}
          onMouseLeave={onNodeMouseLeave}
          onClick={(e) => handleNodeClick(e, { data, selected: true })}
          style={{
            padding: '10px 15px',
            borderRadius: '8px',
            border: `2px solid ${statusColor}`,
            backgroundColor: 'white',
            boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.1)',
            minWidth: '180px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ color: statusColor }}>
              {data.statusIcon || getNodeIcon(data.type)}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
              {data.label}
            </div>
            {data.status && data.status !== 'idle' && (
              <div style={{ 
                fontSize: '12px', 
                padding: '2px 8px', 
                borderRadius: '12px', 
                backgroundColor: (statusColor as string) + '20',
                color: statusColor,
                fontWeight: '500'
              }}>
                {data.status === 'current' ? t('workflow.status.in_progress') : data.status === 'completed' ? t('workflow.status.completed') : t('workflow.status.pending')}
              </div>
            )}
          </div>
        </div>
      )
    }
  }), [t, getNodeIcon, onNodeMouseEnter, onNodeMouseLeave, handleNodeClick])

  return (
    <div className="w-full h-full" style={{ backgroundColor: '#f8fafc' }}>
      <div ref={reactFlowWrapper} style={{ width: '100%', height: '600px' }}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            attributionPosition="bottom-left"
          >
            <Background color="#f1f5f9" gap={16} />
            <Controls />
            <MiniMap
              nodeColor={(node: any) => node.data?.statusColor || '#94a3b8'}
              maskColor="rgba(0, 0, 0, 0.1)"
            />
          </ReactFlow>
        </ReactFlowProvider>
      </div>

      {selectedNode && (
        <div className="fixed top-4 right-4 bg-white rounded-lg shadow-xl p-6 z-50 w-80">
          <h3 className="text-lg font-semibold mb-4">{t('workflow.designer.node_props')}</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">{t('workflow.properties.node_name')}:</span>
              <span className="font-medium">{selectedNode.data.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('workflow.properties.node_type')}:</span>
              <span className="font-medium">{selectedNode.data.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('common.status')}:</span>
              <span className={`font-medium ${selectedNode.data.status === 'current' ? 'text-blue-600' : selectedNode.data.status === 'completed' ? 'text-green-600' : selectedNode.data.status === 'pending' ? 'text-yellow-600' : 'text-gray-600'}`}>
                {selectedNode.data.status === 'current' ? t('workflow.status.in_progress') : selectedNode.data.status === 'completed' ? t('workflow.status.completed') : selectedNode.data.status === 'pending' ? t('workflow.status.pending') : t('workflow.status.not_started')}
              </span>
            </div>
          </div>
          <button
            onClick={() => setSelectedNode(null)}
            className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            {t('common.close')}
          </button>
        </div>
      )}

      <div className="mt-6 p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">{t('workflow.designer.legend')}</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-600">{t('workflow.status.in_progress')}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-600">{t('workflow.status.completed')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{t('workflow.status.not_started')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-600">{t('workflow.nodes.start')}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-red-500" />
            <span className="text-sm text-gray-600">{t('workflow.nodes.end')}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-600">{t('workflow.nodes.approval')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkflowVisualization