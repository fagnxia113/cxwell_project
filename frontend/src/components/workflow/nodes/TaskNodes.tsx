import React from 'react'
import { Handle, Position } from 'reactflow'
import {
  User,
  Settings,
  CheckSquare,
  Users,
  ListOrdered,
  Vote
} from 'lucide-react'
import { WorkflowNodeData } from '../../../types/workflow-designer'

const approverTypeLabels: Record<string, string> = {
  'user': '指定人员',
  'role': '角色',
  'department_manager': '部门负责人',
  'project_manager': '项目经理',
  'initiator': '发起人',
  'form_field': '表单字段',
  'expression': '表达式'
}

const approvalModeLabels: Record<string, string> = {
  'or_sign': '或签',
  'and_sign': '会签',
  'sequential': '依次审批',
  'vote': '投票'
}

export const UserTaskNode: React.FC<{ data: WorkflowNodeData; selected: boolean }> = ({ data, selected }) => {
  const getApprovalModeIcon = () => {
    switch (data.approvalConfig?.approvalMode) {
      case 'or_sign': return <CheckSquare className="w-3 h-3" />
      case 'and_sign': return <Users className="w-3 h-3" />
      case 'sequential': return <ListOrdered className="w-3 h-3" />
      case 'vote': return <Vote className="w-3 h-3" />
      default: return <User className="w-3 h-3" />
    }
  }

  const getApprovalModeLabel = () => {
    return approvalModeLabels[data.approvalConfig?.approvalMode || 'or_sign'] || '或签'
  }

  return (
    <div className="relative">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-500" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-500" />
      <div
        className={`
          min-w-[180px] px-4 py-3 rounded-lg bg-white shadow-md
          border-2 transition-all duration-200
          ${selected ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' : 'border-blue-400'}
        `}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-gray-800 truncate">
              {data.label || '审批'}
            </div>
            {data.approvalConfig?.approverSource?.type && (
              <div className="text-xs text-gray-500">
                {approverTypeLabels[data.approvalConfig.approverSource.type] || data.approvalConfig.approverSource.type}
              </div>
            )}
          </div>
        </div>
        {data.approvalConfig?.approvalMode && (
          <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
            {getApprovalModeIcon()}
            <span>{getApprovalModeLabel()}</span>
            {data.approvalConfig.approvalMode === 'vote' && data.approvalConfig.voteThreshold && (
              <span className="ml-1 text-blue-600">({data.approvalConfig.voteThreshold}票)</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export const ServiceTaskNode: React.FC<{ data: WorkflowNodeData; selected: boolean }> = ({ data, selected }) => {
  const serviceTypeLabels: Record<string, string> = {
    'http': 'HTTP请求',
    'script': '脚本',
    'email': '发送邮件',
    'notification': '发送通知',
    'custom': '自定义'
  }

  return (
    <div className="relative">
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-purple-500" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-purple-500" />
      <div
        className={`
          min-w-[160px] px-4 py-3 rounded-lg bg-white shadow-md
          border-2 transition-all duration-200
          ${selected ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' : 'border-purple-400'}
        `}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <Settings className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-gray-800 truncate">
              {data.label || '服务'}
            </div>
            <div className="text-xs text-gray-500">
              {serviceTypeLabels[data.serviceConfig?.serviceType || ''] || '服务类型'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
