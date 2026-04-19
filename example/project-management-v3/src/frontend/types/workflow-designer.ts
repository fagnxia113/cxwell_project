import { Node, Edge } from 'reactflow'

export interface ApprovalConfig {
  approvalMode: 'or_sign' | 'and_sign' | 'sequential' | 'vote'
  voteThreshold?: number
  approverSource: ApproverSource
  skipCondition?: string
  autoPass?: boolean
  timeout?: number
  timeoutAction?: 'auto_pass' | 'auto_reject' | 'remind'
}

export interface ApproverSource {
  type: 'user' | 'role' | 'department_manager' | 'project_manager' | 'initiator' | 'form_field' | 'expression'
  value?: string
  multiple?: boolean
}

export interface GatewayConfig {
  type: 'exclusive' | 'parallel' | 'inclusive'
  conditions?: GatewayCondition[]
  defaultBranch?: string
}

export interface GatewayCondition {
  id: string
  name: string
  expression: string
  targetNodeId: string
}

export interface ServiceTaskConfig {
  serviceType: 'http' | 'script' | 'email' | 'notification' | 'custom'
  serviceConfig: Record<string, any>
}

export interface WorkflowVariable {
  name: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array'
  defaultValue?: any
  description?: string
  required?: boolean
}

export interface Employee {
  id: string
  name: string
  employeeNo: string
  position?: string
  department?: string
  department_name?: string
  email?: string
  phone?: string
}

export interface WorkflowNodeData {
  label: string
  description?: string
  approvalConfig?: ApprovalConfig
  gatewayConfig?: GatewayConfig
  serviceConfig?: ServiceTaskConfig
  formKey?: string
  [key: string]: any
}

export interface FormField {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'user' | 'boolean' | 'lookup' | 'reference'
  required: boolean
  placeholder?: string
  defaultValue?: any
  options?: Array<{ label: string; value: string }>
  min?: number
  max?: number
  disabled?: boolean
  readonly?: boolean
}

export interface UnifiedWorkflowData {
  nodes: Array<{
    id: string
    type: string
    name: string
    position: { x: number; y: number }
    approvalConfig?: ApprovalConfig
    gatewayConfig?: GatewayConfig
    serviceConfig?: ServiceTaskConfig
    formKey?: string
  }>
  edges: Array<{
    id: string
    source: string
    target: string
    condition?: string
  }>
  variables: WorkflowVariable[]
  formSchema?: FormField[]
}

export interface UnifiedWorkflowDesignerProps {
  initialNodes?: Node[]
  initialEdges?: Edge[]
  initialVariables?: WorkflowVariable[]
  initialFormSchema?: FormField[]
  onSave?: (data: UnifiedWorkflowData) => void
  onExport?: (data: UnifiedWorkflowData) => void
  readOnly?: boolean
}
