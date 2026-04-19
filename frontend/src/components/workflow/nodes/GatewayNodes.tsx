import React from 'react'
import { Handle, Position } from 'reactflow'
import { XCircle, MoreHorizontal } from 'lucide-react'
import { WorkflowNodeData } from '../../../types/workflow-designer'

export const ExclusiveGatewayNode: React.FC<{ data: WorkflowNodeData; selected: boolean }> = ({ data, selected }) => {
  return (
    <div className="relative">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-orange-500" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-orange-500" />
      <Handle type="source" position={Position.Top} className="w-3 h-3 bg-orange-500" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-orange-500" />
      <div
        className={`
          w-14 h-14 flex items-center justify-center
          transform rotate-45 bg-white shadow-md
          border-2 transition-all duration-200
          ${selected ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' : 'border-orange-400'}
        `}
      >
        <XCircle className="w-6 h-6 text-orange-500 transform -rotate-45" />
      </div>
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-gray-600 font-medium">
        {data.label || '排他网关'}
      </div>
    </div>
  )
}

export const ParallelGatewayNode: React.FC<{ data: WorkflowNodeData; selected: boolean }> = ({ data, selected }) => {
  return (
    <div className="relative">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-purple-500" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-purple-500" />
      <Handle type="source" position={Position.Top} className="w-3 h-3 bg-purple-500" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-purple-500" />
      <div
        className={`
          w-14 h-14 flex items-center justify-center
          transform rotate-45 bg-white shadow-md
          border-2 transition-all duration-200
          ${selected ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' : 'border-purple-400'}
        `}
      >
        <MoreHorizontal className="w-6 h-6 text-purple-500 transform -rotate-45" />
      </div>
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-gray-600 font-medium">
        {data.label || '并行网关'}
      </div>
    </div>
  )
}
