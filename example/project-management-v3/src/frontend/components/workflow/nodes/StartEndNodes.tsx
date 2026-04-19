import React from 'react'
import { Handle, Position } from 'reactflow'
import { Play, Square } from 'lucide-react'
import { WorkflowNodeData } from '../../../types/workflow-designer'

export const StartEventNode: React.FC<{ data: WorkflowNodeData; selected: boolean }> = ({ data, selected }) => {
  return (
    <div className="relative">
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-green-500" />
      <div
        className={`
          w-16 h-16 rounded-full flex items-center justify-center
          border-3 bg-white shadow-md
          ${selected ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' : 'border-green-500'}
        `}
      >
        <Play className="w-6 h-6 text-green-500" />
      </div>
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-gray-600 font-medium">
        {data.label || '开始'}
      </div>
    </div>
  )
}

export const EndEventNode: React.FC<{ data: WorkflowNodeData; selected: boolean }> = ({ data, selected }) => {
  return (
    <div className="relative">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-red-500" />
      <div
        className={`
          w-16 h-16 rounded-full flex items-center justify-center
          border-3 bg-white shadow-md
          ${selected ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' : 'border-red-500'}
        `}
      >
        <Square className="w-6 h-6 text-red-500" />
      </div>
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-gray-600 font-medium">
        {data.label || '结束'}
      </div>
    </div>
  )
}
