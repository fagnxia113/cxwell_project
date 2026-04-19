/**
 * Formily表单Schema配置
 * 支持字段权限控制、联动逻辑
 */

// 基础字段组件映射
export const baseFieldComponents = {
  Input: 'Input',
  Select: 'Select',
  DatePicker: 'DatePicker',
  NumberPicker: 'NumberPicker',
  TextArea: 'TextArea',
  Radio: 'Radio.Group',
  Checkbox: 'Checkbox.Group',
  Upload: 'Upload',
  Cascader: 'Cascader'
}

// 字段权限类型
export type FieldPermission = 'editable' | 'readonly' | 'hidden' | 'visible'

// 审批节点字段权限配置
export interface NodeFieldPermission {
  nodeId: string
  nodeName: string
  fields: Record<string, FieldPermission>
}

// 表单Schema配置
export interface FormSchemaConfig {
  type: string
  title: string
  schema: any
  nodePermissions?: NodeFieldPermission[]
}

// 入职申请表单Schema
export const personOnboardSchema: FormSchemaConfig = {
  type: 'person_onboard',
  title: 'workflow.definitions.personnel_onboard',
  schema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        title: 'workflow_form.field.name',
        'x-decorator': 'FormItem',
        'x-decorator-props': {
          required: true
        },
        'x-component': 'Input',
        'x-component-props': {
          placeholder: 'common.inputPlaceholder'
        }
      },
      gender: {
        type: 'string',
        title: 'workflow_form.field.gender',
        required: true,
        'x-decorator': 'FormItem',
        'x-component': 'Radio.Group',
        enum: [
          { label: 'workflow_form.field.male', value: 'male' },
          { label: 'workflow_form.field.female', value: 'female' }
        ]
      },
      phone: {
        type: 'string',
        title: 'workflow_form.field.phone',
        required: true,
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        'x-component-props': {
          placeholder: 'common.inputPlaceholder'
        },
        'x-rules': [
          { pattern: /^1[3-9]\d{9}$/, message: 'workflow_form.field_format' }
        ]
      },
      email: {
        type: 'string',
        title: 'workflow_form.field.email',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        'x-component-props': {
          placeholder: 'common.inputPlaceholder'
        },
        'x-rules': [
          { type: 'email', message: 'workflow_form.field_format' }
        ]
      },
      department: {
        type: 'string',
        title: 'workflow_form.field.department',
        required: true,
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        enum: [
          { label: 'department.tech', value: 'tech' },
          { label: 'department.product', value: 'product' },
          { label: 'department.operation', value: 'operation' },
          { label: 'department.market', value: 'market' },
          { label: 'department.finance', value: 'finance' },
          { label: 'department.hr', value: 'hr' }
        ]
      },
      position: {
        type: 'string',
        title: 'workflow_form.field.position',
        required: true,
        'x-decorator': 'FormItem',
        'x-component': 'Input'
      },
      hire_date: {
        type: 'string',
        title: 'workflow_form.field.hire_date',
        required: true,
        'x-decorator': 'FormItem',
        'x-component': 'DatePicker',
        'x-component-props': {
          format: 'YYYY-MM-DD'
        }
      },
      id_card: {
        type: 'string',
        title: 'workflow_form.field.id_card',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        'x-rules': [
          { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: 'workflow_form.field_format' }
        ]
      },
      employee_no: {
        type: 'string',
        title: 'workflow_form.field.employee_no',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        'x-visible': false,  // 默认隐藏，HR节点可见
        'x-reactions': {
          dependencies: ['_currentNode'],
          fulfill: {
            state: {
              visible: '{{$deps[0] === "hr_approve"}}'
            }
          }
        }
      },
      notes: {
        type: 'string',
        title: 'workflow_form.field.notes',
        'x-decorator': 'FormItem',
        'x-component': 'TextArea',
        'x-component-props': {
          rows: 3,
          placeholder: 'common.inputPlaceholder'
        }
      }
    }
  },
  nodePermissions: [
    {
      nodeId: 'apply',
      nodeName: 'workflow.definitions.start_apply',
      fields: {
        name: 'editable',
        gender: 'editable',
        phone: 'editable',
        email: 'editable',
        department: 'editable',
        position: 'editable',
        hire_date: 'editable',
        id_card: 'editable',
        employee_no: 'hidden',
        notes: 'editable'
      }
    },
    {
      nodeId: 'dept_approve',
      nodeName: 'workflow.definitions.dept_approve',
      fields: {
        name: 'readonly',
        gender: 'readonly',
        phone: 'readonly',
        email: 'readonly',
        department: 'readonly',
        position: 'readonly',
        hire_date: 'readonly',
        id_card: 'readonly',
        employee_no: 'hidden',
        notes: 'readonly'
      }
    },
    {
      nodeId: 'hr_approve',
      nodeName: 'workflow.definitions.hr_approve',
      fields: {
        name: 'readonly',
        gender: 'readonly',
        phone: 'readonly',
        email: 'readonly',
        department: 'readonly',
        position: 'readonly',
        hire_date: 'readonly',
        id_card: 'readonly',
        employee_no: 'editable',  // HR可编辑工号
        notes: 'readonly'
      }
    }
  ]
}

// 设备入库表单Schema
export const equipmentInboundSchema: FormSchemaConfig = {
  type: 'equipment_inbound',
  title: 'workflow.definitions.equipment_inbound',
  schema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        title: 'workflow_form.field.equipment_name',
        required: true,
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        'x-component-props': {
          placeholder: 'common.inputPlaceholder'
        }
      },
      model: {
        type: 'string',
        title: 'workflow_form.field.model_spec',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        'x-component-props': {
          placeholder: 'common.inputPlaceholder'
        }
      },
      brand: {
        type: 'string',
        title: 'workflow_form.field.brand',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        'x-component-props': {
          placeholder: 'common.inputPlaceholder'
        }
      },
      technical_params: {
        type: 'string',
        title: 'workflow_form.field.technical_params',
        'x-decorator': 'FormItem',
        'x-component': 'TextArea',
        'x-component-props': {
          placeholder: 'common.inputPlaceholder',
          rows: 2
        }
      },
      category: {
        type: 'string',
        title: 'workflow_form.field.category',
        required: true,
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        'x-component-props': {
          placeholder: 'common.inputPlaceholder'
        },
        enum: [
          { label: 'equipment.category.computer', value: 'computer' },
          { label: 'equipment.category.printer', value: 'printer' },
          { label: 'equipment.category.server', value: 'server' },
          { label: 'equipment.category.network', value: 'network' },
          { label: 'equipment.category.furniture', value: 'furniture' },
          { label: 'equipment.category.other', value: 'other' }
        ]
      },
      quantity: {
        type: 'number',
        title: 'workflow_form.field.quantity',
        required: true,
        'x-decorator': 'FormItem',
        'x-component': 'NumberPicker',
        'x-component-props': {
          min: 1,
          placeholder: 'common.inputPlaceholder'
        }
      },
      warehouse_id: {
        type: 'string',
        title: 'workflow_form.field.warehouse',
        required: true,
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        'x-component-props': {
          placeholder: 'common.inputPlaceholder'
        },
        'x-reactions': {
          fulfill: {
            state: {
              dataSource: '{{$self.queryWarehouses()}}'
            }
          }
        }
      },
      supplier: {
        type: 'string',
        title: 'workflow_form.field.supplier',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        'x-component-props': {
          placeholder: 'common.inputPlaceholder'
        }
      },
      purchase_date: {
        type: 'string',
        title: 'workflow_form.field.purchase_date',
        'x-decorator': 'FormItem',
        'x-component': 'DatePicker',
        'x-component-props': {
          placeholder: 'common.inputPlaceholder'
        }
      },
      price: {
        type: 'number',
        title: 'workflow_form.field.purchase_price',
        'x-decorator': 'FormItem',
        'x-component': 'NumberPicker',
        'x-component-props': {
          prefix: '¥',
          precision: 2,
          placeholder: 'common.inputPlaceholder'
        }
      },
      notes: {
        type: 'string',
        title: 'workflow_form.field.notes',
        'x-decorator': 'FormItem',
        'x-component': 'TextArea',
        'x-component-props': {
          placeholder: 'common.inputPlaceholder',
          rows: 3
        }
      }
    }
  }
}

// 项目结项表单Schema
export const projectCompletionSchema: FormSchemaConfig = {
  type: 'project_completion',
  title: 'workflow.definitions.project_completion',
  schema: {
    type: 'object',
    properties: {
      project_id: {
        type: 'string',
        title: 'sidebar.projects',
        required: true,
        'x-decorator': 'FormItem',
        'x-component': 'Select'
      },
      actual_start: {
        type: 'string',
        title: 'workflow_form.field.actual_start',
        'x-decorator': 'FormItem',
        'x-component': 'DatePicker'
      },
      actual_end: {
        type: 'string',
        title: 'workflow_form.field.actual_end',
        required: true,
        'x-decorator': 'FormItem',
        'x-component': 'DatePicker'
      },
      total_cost: {
        type: 'number',
        title: 'workflow_form.field.total_cost',
        'x-decorator': 'FormItem',
        'x-component': 'NumberPicker',
        'x-component-props': {
          prefix: '¥',
          precision: 2
        }
      },
      total_revenue: {
        type: 'number',
        title: 'workflow_form.field.total_revenue',
        'x-decorator': 'FormItem',
        'x-component': 'NumberPicker',
        'x-component-props': {
          prefix: '¥',
          precision: 2
        }
      },
      completion_status: {
        type: 'string',
        title: 'workflow_form.field.completion_status',
        required: true,
        'x-decorator': 'FormItem',
        'x-component': 'Radio.Group',
        enum: [
          { label: 'workflow_form.field.on_time', value: 'on_time' },
          { label: 'workflow_form.field.early', value: 'early' },
          { label: 'workflow_form.field.delayed', value: 'delayed' }
        ]
      },
      summary: {
        type: 'string',
        title: 'workflow_form.field.summary',
        'x-decorator': 'FormItem',
        'x-component': 'TextArea',
        'x-component-props': {
          rows: 5
        }
      }
    }
  }
}

// Schema注册表
export const formSchemaRegistry: Record<string, FormSchemaConfig> = {
  'person_onboard': personOnboardSchema,
  'equipment_inbound': equipmentInboundSchema,
  'project_completion': projectCompletionSchema
}

// 根据类型获取Schema
export function getFormSchema(type: string): FormSchemaConfig | null {
  return formSchemaRegistry[type] || null
}

// 根据节点权限过滤Schema
export function applyNodePermissions(schema: any, nodePermissions: NodeFieldPermission[], currentNode: string) {
  const permission = nodePermissions.find(p => p.nodeId === currentNode)
  if (!permission) return schema

  const newSchema = JSON.parse(JSON.stringify(schema))
  
  Object.keys(permission.fields).forEach(fieldKey => {
    const fieldPermission = permission.fields[fieldKey]
    if (newSchema.properties[fieldKey]) {
      switch (fieldPermission) {
        case 'hidden':
          newSchema.properties[fieldKey]['x-visible'] = false
          break
        case 'readonly':
          newSchema.properties[fieldKey]['x-disabled'] = true
          newSchema.properties[fieldKey]['x-visible'] = true
          break
        case 'editable':
          newSchema.properties[fieldKey]['x-disabled'] = false
          newSchema.properties[fieldKey]['x-visible'] = true
          break
        case 'visible':
          newSchema.properties[fieldKey]['x-visible'] = true
          break
      }
    }
  })
  
  return newSchema
}
