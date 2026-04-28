import React, { useState } from 'react'
import { Node } from 'reactflow'
import { useTranslation } from 'react-i18next'
import {
  Settings,
  User,
  GitBranch,
  Trash,
  CheckSquare,
  Users,
  ListOrdered,
  Vote,
  Plus
} from 'lucide-react'
import {
  ApprovalConfig,
  ApproverSource,
  GatewayConfig,
  GatewayCondition,
  ServiceTaskConfig
} from '../../types/workflow-designer'
import { useOrganizationData } from '../../hooks/useOrganizationData'
import EmployeeSelectorModal from './EmployeeSelectorModal'

interface NodeConfigPanelProps {
  node: Node
  onUpdate: (key: string, value: any) => void
  onDelete?: () => void
  readOnly?: boolean
}

const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({ node, onUpdate, onDelete, readOnly }) => {
  const { t } = useTranslation()
  const [activeSection, setActiveSection] = useState<'basic' | 'approval' | 'gateway' | 'service'>('basic')
  const [showEmployeeSelector, setShowEmployeeSelector] = useState(false)
  
  const { employees, positions, departments, loading: orgLoading } = useOrganizationData()

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
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('workflow.approval_method')}</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'or_sign', label: t('workflow.approval_mode.or_sign'), icon: CheckSquare, desc: t('workflow.approval_mode.or_sign_desc') },
              { value: 'and_sign', label: t('workflow.approval_mode.and_sign'), icon: Users, desc: t('workflow.approval_mode.and_sign_desc') },
              { value: 'sequential', label: t('workflow.approval_mode.sequential'), icon: ListOrdered, desc: t('workflow.approval_mode.sequential_desc') },
              { value: 'vote', label: t('workflow.approval_mode.vote'), icon: Vote, desc: t('workflow.approval_mode.vote_desc') }
            ].map((mode) => (
              <button
                key={mode.value}
                onClick={() => updateConfig('approvalMode', mode.value as any)}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('workflow.vote_threshold')}</label>
            <input
              type="number"
              min={1}
              value={config.voteThreshold || 1}
              onChange={(e) => updateConfig('voteThreshold', parseInt(e.target.value))}
              disabled={readOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500">{t('workflow.vote_threshold_hint')}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('workflow.approver_source')}</label>
          <select
            value={config.approverSource?.type || 'role'}
            onChange={(e) => updateApproverSource('type', e.target.value as any)}
            disabled={readOnly}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="role">角色</option>
            <option value="user">指定人员</option>
            <option value="reportTo_manager">直属上级</option>
            <option value="reportTo_deptLeader">部门负责人</option>
            <option value="reportTo_n2">上2级上级</option>
            <option value="reportTo_n3">上3级上级</option>
            <option value="project_manager">项目经理</option>
            <option value="initiator">发起人</option>
          </select>
        </div>

        {config.approverSource?.type === 'role' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('workflow.approval_role')}</label>
            <select
              value={config.approverSource?.value || ''}
              onChange={(e) => updateApproverSource('value', e.target.value)}
              disabled={readOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">{t('common.select')}</option>
              <option value="admin">超级管理员</option>
              <option value="general_manager">总经理</option>
              <option value="hr">人事主管</option>
              <option value="pm">项目经理</option>
              <option value="finance">财务主管</option>
              <option value="dept_manager">部门经理</option>
              <option value="epy">员工</option>
            </select>
          </div>
        )}

        {config.approverSource?.type === 'user' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">指定人员</label>
            <div className="space-y-2">
              <button
                type="button"
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
              employees={employees}
              positions={positions}
              departments={departments}
              loading={orgLoading}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('workflow.skip_condition')}</label>
          <select
            value={config.skipCondition || 'none'}
            onChange={(e) => updateConfig('skipCondition', e.target.value)}
            disabled={readOnly}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="none">{t('workflow.skip_none')}</option>
            <option value="no_approvers">{t('workflow.skip_no_approvers')}</option>
            <option value="always">{t('workflow.skip_always')}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('workflow.timeout_hours')}</label>
          <input
            type="number"
            min={0}
            value={config.timeout || 0}
            onChange={(e) => updateConfig('timeout', parseInt(e.target.value))}
            disabled={readOnly}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <p className="mt-1 text-xs text-gray-500">{t('workflow.timeout_hint')}</p>
        </div>

        {config.timeout && config.timeout > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">超时动作</label>
            <select
              value={config.timeoutAction || 'remind'}
              onChange={(e) => updateConfig('timeoutAction', e.target.value as any)}
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
                type="button"
                onClick={() => onUpdate('gatewayConfig', { ...config, type: type.value as any })}
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
                type="button"
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
            onChange={(e) => onUpdate('serviceConfig', { ...config, serviceType: e.target.value as any })}
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
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700">节点配置</h3>
        {onDelete && !readOnly && (
          <button 
            type="button"
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
            type="button"
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

export default NodeConfigPanel
