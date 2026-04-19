/**
 * 流程模板服务
 * 提供硬编码的流程模板，支持不同业务场景的流程定义
 * 包含完整的节点定义、审批规则和表单配置
 */

import { WorkflowNode, WorkflowEdge, WorkflowDefinition } from '../types/workflow.js';

interface WorkflowTemplate {
  id: string;
  name: string;
  category: string;
  entityType: string;
  description: string;
  definition: {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };
  formSchema?: any[];
  formTemplateId?: string;
  version: string;
}

/**
 * 项目审批流程模板
 */
export const PROJECT_APPROVAL_TEMPLATE: WorkflowTemplate = {
  id: 'project-approval',
  name: '项目审批流程',
  category: 'project',
  entityType: 'Project',
  description: '项目立项、变更、结项审批流程',
  version: '1.0.0',
  definition: {
    nodes: [
      {
        id: 'start',
        type: 'startEvent',
        name: '提交申请'
      },
      {
        id: 'dept-manager',
        type: 'userTask',
        name: '部门经理审批',
        approvalConfig: {
          approvalType: 'single',
          approverSource: {
            type: 'role',
            value: 'department_manager'
          }
        },
        actions: {
          allowed: ['approve', 'reject', 'return', 'transfer', 'delegate', 'saveDraft'],
          defaultAction: 'approve'
        }
      },
      {
        id: 'gateway-1',
        type: 'exclusiveGateway',
        name: '审批判断',
        gatewayConfig: {
          conditions: [
            {
              id: 'condition-1',
              name: '预算大于10万',
              expression: '${formData.budget != null && formData.budget > 100000}',
              targetNode: 'gm'
            }
          ],
          defaultFlow: 'create-project'
        }
      },
      {
        id: 'gm',
        type: 'userTask',
        name: '总经理审批',
        approvalConfig: {
          approvalType: 'single',
          approverSource: {
            type: 'role',
            value: 'general_manager'
          }
        },
        actions: {
          allowed: ['approve', 'reject', 'return', 'transfer', 'delegate', 'saveDraft'],
          defaultAction: 'approve'
        }
      },
      {
        id: 'create-project',
        type: 'serviceTask',
        name: '创建项目台账',
        config: {
          serviceType: 'createProjectLedger'
        }
      },
      {
        id: 'end-approved',
        type: 'endEvent',
        name: '审批通过'
      },
      {
        id: 'end-rejected',
        type: 'endEvent',
        name: '审批驳回'
      }
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'start',
        target: 'dept-manager',
        type: 'sequenceFlow'
      },
      {
        id: 'edge-2',
        source: 'dept-manager',
        target: 'gateway-1',
        type: 'sequenceFlow'
      },
      {
        id: 'edge-3',
        source: 'gateway-1',
        target: 'gm',
        type: 'sequenceFlow',
        condition: '${formData.budget > 100000}'
      },
      {
        id: 'edge-4',
        source: 'gateway-1',
        target: 'create-project',
        type: 'sequenceFlow',
        condition: '${formData.budget <= 100000}'
      },
      {
        id: 'edge-5',
        source: 'gm',
        target: 'create-project',
        type: 'sequenceFlow'
      },
      {
        id: 'edge-6',
        source: 'create-project',
        target: 'end-approved',
        type: 'sequenceFlow'
      }
    ]
  },
  formSchema: [
    // ========== 基本信息 ==========
    {
      name: 'name',
      label: '项目名称',
      type: 'text',
      required: true,
      placeholder: '请输入项目名称',
      group: '基本信息',
      visibleOn: ['start', 'dept-manager', 'gm'],
      editableOn: ['start']
    },
    {
      name: 'code',
      label: '项目编号',
      type: 'text',
      required: false,
      placeholder: '系统自动生成',
      disabled: true,
      group: '基本信息',
      visibleOn: ['start', 'dept-manager', 'gm'],
      editableOn: []
    },
    {
      name: 'manager_id',
      label: '项目经理',
      type: 'user',
      required: true,
      placeholder: '请选择项目经理',
      group: '基本信息',
      visibleOn: ['start', 'dept-manager', 'gm'],
      editableOn: ['start'],
      display: {
        type: 'user',
        format: 'name'
      }
    },
    {
      name: 'start_date',
      label: '项目开始日期',
      type: 'date',
      required: true,
      group: '基本信息',
      visibleOn: ['start', 'dept-manager', 'gm'],
      editableOn: ['start']
    },
    {
      name: 'end_date',
      label: '项目结束日期',
      type: 'date',
      required: false,
      group: '基本信息',
      visibleOn: ['start', 'dept-manager', 'gm'],
      editableOn: ['start']
    },
    {
      name: 'country',
      label: '所属国家',
      type: 'select',
      required: false,
      defaultValue: '中国',
      options: [
        { label: '中国', value: '中国' },
        { label: '美国', value: '美国' },
        { label: '新加坡', value: '新加坡' },
        { label: '马来西亚', value: '马来西亚' },
        { label: '印度尼西亚', value: '印度尼西亚' },
        { label: '泰国', value: '泰国' },
        { label: '越南', value: '越南' },
        { label: '菲律宾', value: '菲律宾' },
        { label: '日本', value: '日本' },
        { label: '韩国', value: '韩国' },
        { label: '阿联酋', value: '阿联酋' },
        { label: '沙特阿拉伯', value: '沙特阿拉伯' },
        { label: '德国', value: '德国' },
        { label: '英国', value: '英国' },
        { label: '其他', value: '其他' }
      ],
      group: '基本信息',
      visibleOn: ['start', 'dept-manager', 'gm'],
      editableOn: ['start']
    },
    {
      name: 'address',
      label: '项目地址',
      type: 'text',
      required: false,
      placeholder: '请输入项目地址',
      group: '基本信息',
      visibleOn: ['start', 'dept-manager', 'gm'],
      editableOn: ['start']
    },
    {
      name: 'status',
      label: '项目状态',
      type: 'select',
      required: true,
      defaultValue: 'proposal',
      options: [
        { label: '立项', value: 'proposal' },
        { label: '进行中', value: 'in_progress' },
        { label: '已完成', value: 'completed' },
        { label: '暂停', value: 'paused' }
      ],
      group: '基本信息',
      visibleOn: ['start', 'dept-manager', 'gm'],
      editableOn: ['start']
    },
    // ========== 项目规模 ==========
    {
      name: 'description',
      label: '项目描述',
      type: 'textarea',
      required: false,
      placeholder: '请输入项目描述信息',
      rows: 3,
      group: '项目规模',
      visibleOn: ['start', 'dept-manager', 'gm'],
      editableOn: ['start']
    },
    {
      name: 'building_area',
      label: '建筑面积(m²)',
      type: 'number',
      required: false,
      min: 0,
      group: '项目规模',
      visibleOn: ['start', 'dept-manager', 'gm'],
      editableOn: ['start']
    },
    {
      name: 'it_capacity',
      label: 'IT容量(MW)',
      type: 'number',
      required: false,
      min: 0,
      group: '项目规模',
      visibleOn: ['start', 'dept-manager', 'gm'],
      editableOn: ['start']
    },
    {
      name: 'cabinet_count',
      label: '机柜数量',
      type: 'number',
      required: false,
      min: 0,
      group: '项目规模',
      visibleOn: ['start', 'dept-manager', 'gm'],
      editableOn: ['start']
    },
    {
      name: 'cabinet_power',
      label: '单机柜功率(KW)',
      type: 'number',
      required: false,
      min: 0,
      group: '项目规模',
      visibleOn: ['start', 'dept-manager', 'gm'],
      editableOn: ['start']
    },
    // ========== 技术架构 ==========
    {
      name: 'power_architecture',
      label: '供电架构',
      type: 'textarea',
      required: false,
      placeholder: '供电系统架构描述',
      rows: 2,
      group: '技术架构',
      visibleOn: ['start', 'dept-manager', 'gm'],
      editableOn: ['start']
    },
    {
      name: 'hvac_architecture',
      label: '暖通架构',
      type: 'textarea',
      required: false,
      placeholder: '暖通系统架构描述',
      rows: 2,
      group: '技术架构',
      visibleOn: ['start', 'dept-manager', 'gm'],
      editableOn: ['start']
    },
    {
      name: 'fire_architecture',
      label: '消防架构',
      type: 'textarea',
      required: false,
      placeholder: '消防系统架构描述',
      rows: 2,
      group: '技术架构',
      visibleOn: ['start', 'dept-manager', 'gm'],
      editableOn: ['start']
    },
    {
      name: 'weak_electric_architecture',
      label: '弱电架构',
      type: 'textarea',
      required: false,
      placeholder: '弱电系统架构描述',
      rows: 2,
      group: '技术架构',
      visibleOn: ['start', 'dept-manager', 'gm'],
      editableOn: ['start']
    },
    // ========== 商务信息 ==========
    {
      name: 'customer_id',
      label: '客户',
      type: 'lookup',
      required: false,
      placeholder: '请选择客户',
      businessConfig: {
        entityType: 'Customer',
        lookupField: 'id',
        displayField: 'name'
      },
      group: '商务信息',
      visibleOn: ['start', 'dept-manager', 'gm'],
      editableOn: ['start'],
      display: {
        type: 'lookup',
        format: 'name'
      }
    },
    {
      name: 'budget',
      label: '预算金额(万元)',
      type: 'number',
      required: false,
      placeholder: '请输入预算金额',
      min: 0,
      group: '商务信息',
      visibleOn: ['start', 'dept-manager', 'gm'],
      editableOn: ['start']
    }
  ]
};

/**
 * 设备调拨流程模板
 */
export const EQUIPMENT_TRANSFER_TEMPLATE: WorkflowTemplate = {
  id: 'equipment-transfer',
  name: '设备调播流程',
  category: 'equipment',
  entityType: 'EquipmentTransfer',
  description: '设备调拨审批流程：包含发货核对、调拨中状态、实收确认及未到货处理。',
  version: '2.1.1',
  definition: {
    nodes: [
      {
        id: 'start',
        type: 'startEvent',
        name: '提交调拨申请',
        config: {
          formKey: 'equipment-transfer-form'
        }
      },
      {
        id: 'from-location-manager',
        type: 'userTask',
        name: '调出位置负责人审批并确认发货',
        config: {
          approvalConfig: {
            approvalType: 'single',
            approverSource: {
              type: 'expression',
              value: '${formData.from_manager_id}'
            }
          },
          formKey: 'equipment-transfer-shipping-form'
        },
        actions: {
          allowed: ['approve', 'reject', 'return', 'saveDraft'],
          defaultAction: 'approve'
        }
      },
      {
        id: 'service-task-shipping',
        type: 'serviceTask',
        name: '调拨中状态处理',
        config: {
          serviceType: 'transfer_shipping'
        }
      },
      {
        id: 'to-location-manager',
        type: 'userTask',
        name: '调入位置负责人审批并确认收货',
        config: {
          approvalConfig: {
            approvalType: 'single',
            approverSource: {
              type: 'expression',
              value: '${formData.to_manager_id}'
            },
            allowReject: false,
            allowReturn: true,
            returnTarget: 'from-location-manager'
          },
          formKey: 'equipment-transfer-receiving-form'
        },
        actions: {
          allowed: ['approve', 'return', 'saveDraft'],
          defaultAction: 'approve'
        }
      },
      {
        id: 'service-task-receiving',
        type: 'serviceTask',
        name: '收货入库处理',
        config: {
          serviceType: 'transfer_receiving'
        }
      },
      {
        id: 'receive-gateway',
        type: 'exclusiveGateway',
        name: '收货完整性判断',
        config: {
          gatewayConfig: {
            conditions: [
              {
                id: 'condition-full',
                name: '全部收货',
                expression: '${formData.receive_status === "normal"}',
                targetNode: 'end-approved'
              },
              {
                id: 'condition-partial',
                name: '部分收货',
                expression: '${formData.receive_status === "partial"}',
                targetNode: 'unreceived-review'
              },
              {
                id: 'condition-unreceived',
                name: '全部未到货',
                expression: '${formData.receive_status === "unreceived"}',
                targetNode: 'unreceived-review'
              }
            ],
            defaultFlow: 'unreceived-review'
          }
        }
      },
      {
        id: 'unreceived-review',
        type: 'userTask',
        name: '调出负责人核实未到货项目',
        config: {
          approvalConfig: {
            approvalType: 'single',
            approverSource: {
              type: 'expression',
              value: '${formData.from_manager_id}'
            }
          },
          formKey: 'equipment-transfer-unreceived-review-form'
        },
        actions: {
          allowed: ['approve', 'return', 'saveDraft'],
          defaultAction: 'approve'
        }
      },
      {
        id: 'service-task-unreceived-complete',
        type: 'serviceTask',
        name: '未到货核实完成处理',
        config: {
          serviceType: 'transfer_unreceived_complete'
        }
      },
      {
        id: 'end-approved',
        type: 'endEvent',
        name: '调拨已完成'
      },
      {
        id: 'end-rejected',
        type: 'endEvent',
        name: '流程已终止'
      }
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'from-location-manager', type: 'sequenceFlow' },
      { id: 'e2', source: 'from-location-manager', target: 'service-task-shipping', type: 'sequenceFlow', condition: '${action === "approve"}' },
      { id: 'e3', source: 'from-location-manager', target: 'end-rejected', type: 'sequenceFlow', condition: '${action === "reject"}' },
      { id: 'e4', source: 'service-task-shipping', target: 'to-location-manager', type: 'sequenceFlow' },
      { id: 'e5', source: 'to-location-manager', target: 'service-task-receiving', type: 'sequenceFlow', condition: '${action === "approve"}' },
      { id: 'e6', source: 'service-task-receiving', target: 'receive-gateway', type: 'sequenceFlow' },
      { id: 'e7', source: 'receive-gateway', target: 'end-approved', type: 'sequenceFlow', condition: '${formData.receive_status === "normal"}' },
      { id: 'e8', source: 'receive-gateway', target: 'unreceived-review', type: 'sequenceFlow', condition: '${formData.receive_status === "partial"}' },
      { id: 'e8b', source: 'receive-gateway', target: 'unreceived-review', type: 'sequenceFlow', condition: '${formData.receive_status === "unreceived"}' },
      { id: 'e9', source: 'unreceived-review', target: 'service-task-unreceived-complete', type: 'sequenceFlow', condition: '${action === "approve"}' },
      { id: 'e10', source: 'unreceived-review', target: 'end-approved', type: 'sequenceFlow', condition: '${action === "return"}' },
      { id: 'e11', source: 'service-task-unreceived-complete', target: 'end-approved', type: 'sequenceFlow' }
    ]
  },
  formSchema: [
    {
      name: 'fromLocationType',
      label: '调出位置类型',
      type: 'select',
      required: true,
      options: [
        { label: '仓库', value: 'warehouse' },
        { label: '项目', value: 'project' }
      ],
      group: '库位信息',
      visibleOn: ['start', 'from-location-manager', 'to-location-manager', 'unreceived-review'],
      editableOn: ['start']
    },
    {
      name: 'fromLocationId',
      label: '调出位置',
      type: 'select',
      dynamicOptions: 'fromLocationType',
      required: true,
      group: '库位信息',
      businessConfig: {
        autoFill: true
      },
      visibleOn: ['start', 'from-location-manager', 'to-location-manager', 'unreceived-review'],
      editableOn: ['start']
    },
    {
      name: 'from_manager_id',
      label: '调出位置负责人',
      type: 'user',
      required: false,
      visibleOn: ['start', 'from-location-manager', 'to-location-manager', 'unreceived-review'],
      editableOn: [],
      group: '库位信息',
      businessConfig: {
        autoFilled: true,
        autoFillSource: 'location_manager',
        dependsOn: ['fromLocationType', 'fromLocationId']
      }
    },
    {
      name: 'toLocationType',
      label: '调入位置类型',
      type: 'select',
      required: true,
      options: [
        { label: '仓库', value: 'warehouse' },
        { label: '项目', value: 'project' }
      ],
      group: '库位信息',
      visibleOn: ['start', 'from-location-manager', 'to-location-manager', 'unreceived-review'],
      editableOn: ['start']
    },
    {
      name: 'toLocationId',
      label: '调入位置',
      type: 'select',
      dynamicOptions: 'toLocationType',
      required: true,
      group: '库位信息',
      businessConfig: {
        autoFill: true
      },
      visibleOn: ['start', 'from-location-manager', 'to-location-manager', 'unreceived-review'],
      editableOn: ['start']
    },
    {
      name: 'to_manager_id',
      label: '调入位置负责人',
      type: 'user',
      required: false,
      visibleOn: ['start', 'from-location-manager', 'to-location-manager', 'unreceived-review'],
      editableOn: [],
      group: '库位信息',
      businessConfig: {
        autoFilled: true,
        autoFillSource: 'location_manager',
        dependsOn: ['toLocationType', 'toLocationId']
      }
    },
    {
      name: 'transferReason',
      label: '调拨原因',
      type: 'textarea',
      required: true,
      group: '调拨基础信息',
      visibleOn: ['start', 'from-location-manager', 'to-location-manager', 'unreceived-review'],
      editableOn: ['start']
    },
    {
      name: 'expectedArrivalDate',
      label: '期望到货时间',
      type: 'date',
      required: true,
      group: '调拨基础信息',
      visibleOn: ['start', 'from-location-manager', 'to-location-manager', 'unreceived-review'],
      editableOn: ['start']
    },
    {
      name: 'items',
      label: '调拨明细',
      type: 'array',
      required: true,
      layout: { width: 'full' },
      group: '设备明细清单',
      visibleOn: ['start', 'from-location-manager', 'to-location-manager', 'unreceived-review'],
      editableOn: ['start', 'from-location-manager', 'to-location-manager'],
      arrayConfig: {
        modalSelector: true,
        fields: [
          {
            name: 'equipment_id',
            label: '选择设备',
            type: 'select',
            required: true,
            placeholder: '请选择要调拨的设备',
            dynamicOptionsConfig: {
              source: '/api/equipment/instances',
              labelField: 'equipment_name',
              valueField: 'id'
            }
          },
          {
            name: 'equipment_name',
            label: '设备名称',
            type: 'text',
            required: true,
            placeholder: '自动填充'
          },
          {
            name: 'model_no',
            label: '型号规格',
            type: 'text',
            required: false,
            placeholder: '自动填充'
          },
          {
            name: 'manage_code',
            label: '管理编码',
            type: 'text',
            required: false,
            placeholder: '自动填充'
          },
          {
            name: 'quantity',
            label: '调拨数量',
            type: 'number',
            required: true,
            placeholder: '请输入调拨数量',
            defaultValue: 1
          },
          {
            name: 'unit',
            label: '单位',
            type: 'text',
            required: false,
            placeholder: '自动填充'
          },
          {
            name: 'notes',
            label: '备注',
            type: 'text',
            required: false,
            placeholder: '选填'
          },
          {
            name: 'shipping_images',
            label: '发货照片',
            type: 'file',
            required: false,
            placeholder: '请上传资产发货照片',
            visibleOn: ['from-location-manager', 'to-location-manager', 'unreceived-review']
          },
          {
            name: 'receiving_images',
            label: '收货确认照片',
            type: 'images',
            required: false,
            placeholder: '请上传资产到货照片',
            visibleOn: ['to-location-manager', 'unreceived-review']
          },
          {
            name: 'received_quantity',
            label: '实收数量',
            type: 'number',
            required: false,
            placeholder: '请输入实收数量',
            visibleOn: ['to-location-manager', 'unreceived-review']
          }
        ]
      }
    },
    {
      name: 'shipping_package_images',
      label: '整单打包照片',
      type: 'file',
      required: false,
      group: '发运与收货',
      visibleOn: ['from-location-manager', 'to-location-manager', 'unreceived-review'],
      editableOn: ['from-location-manager']
    },
    {
      name: 'receiving_package_images',
      label: '整单收货照片',
      type: 'file',
      required: false,
      group: '发运与收货',
      visibleOn: ['to-location-manager', 'unreceived-review'],
      editableOn: ['to-location-manager']
    },
    {
      name: 'shipped_at',
      label: '发货时间',
      type: 'datetime',
      required: true,
      group: '发运与收货',
      visibleOn: ['from-location-manager', 'to-location-manager', 'unreceived-review'],
      editableOn: ['from-location-manager']
    },
    {
      name: 'shipping_remark',
      label: '发货备注',
      type: 'textarea',
      required: false,
      group: '发运与收货',
      visibleOn: ['from-location-manager', 'to-location-manager', 'unreceived-review'],
      editableOn: ['from-location-manager']
    },
    {
      name: 'received_at',
      label: '到货时间',
      type: 'datetime',
      required: true,
      group: '发运与收货',
      visibleOn: ['to-location-manager', 'unreceived-review'],
      editableOn: ['to-location-manager']
    },
    {
      name: 'receive_status',
      label: '收货状态',
      type: 'select',
      required: true,
      group: '发运与收货',
      options: [
        { label: '全部收货', value: 'normal' },
        { label: '部分收货', value: 'partial' },
        { label: '全部未到货', value: 'unreceived' }
      ],
      visibleOn: ['to-location-manager', 'unreceived-review'],
      editableOn: ['to-location-manager']
    }
  ]
};

/**
 * 任务审批流程模板
 */
export const TASK_APPROVAL_TEMPLATE: WorkflowTemplate = {
  id: 'task-completion',
  name: '任务验收流程',
  category: 'task',
  entityType: 'Task',
  description: '任务完工验收审批流程',
  version: '1.0.0',
  definition: {
    nodes: [
      {
        id: 'start',
        type: 'startEvent',
        name: '提交验收申请',
        config: {
          formKey: 'task-approval-form'
        }
      },
      {
        id: 'project-manager',
        type: 'userTask',
        name: '项目经理审批',
        config: {
          approvalConfig: {
            approvalType: 'single',
            approverSource: {
              type: 'expression',
              value: '${formData.projectManager}'
            }
          }
        }
      },
      {
        id: 'service-task-task-progress',
        type: 'serviceTask',
        name: '自动推升任务进度',
        config: {
          serviceType: 'task_completion'
        }
      },
      {
        id: 'end-approved',
        type: 'endEvent',
        name: '验收通过'
      },
      {
        id: 'end-rejected',
        type: 'endEvent',
        name: '验收驳回'
      }
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'start',
        target: 'project-manager',
        type: 'sequenceFlow'
      },
      {
        id: 'edge-2',
        source: 'project-manager',
        target: 'service-task-task-progress',
        type: 'sequenceFlow',
        condition: '${action === "approve"}'
      },
      {
        id: 'edge-3',
        source: 'service-task-task-progress',
        target: 'end-approved',
        type: 'sequenceFlow'
      },
      {
        id: 'edge-4',
        source: 'project-manager',
        target: 'end-rejected',
        type: 'sequenceFlow',
        condition: '${action === "reject"}'
      }
    ]
  },
  formSchema: [
    {
      name: 'task_name',
      label: '任务名称',
      type: 'text',
      required: true,
      placeholder: '请输入任务名称'
    },
    {
      name: 'project_id',
      label: '所属项目',
      type: 'select',
      required: true,
      placeholder: '请选择所属项目'
    },
    {
      name: 'project_manager',
      label: '项目经理',
      type: 'user',
      required: true,
      placeholder: '请选择项目经理'
    },
    {
      name: 'assignee',
      label: '任务负责人',
      type: 'user',
      required: true,
      placeholder: '请选择任务负责人'
    },
    {
      name: 'deadline',
      label: '截止日期',
      type: 'date',
      required: true
    },
    {
      name: 'priority',
      label: '优先级',
      type: 'select',
      required: true,
      options: [
        { label: '低', value: 'low' },
        { label: '中', value: 'medium' },
        { label: '高', value: 'high' }
      ]
    },
    {
      name: 'description',
      label: '任务描述',
      type: 'textarea',
      required: true,
      placeholder: '请输入任务描述',
      rows: 3
    }
  ]
};

/**
 * 采购审批流程模板
 */
export const PURCHASE_APPROVAL_TEMPLATE: WorkflowTemplate = {
  id: 'purchase-approval',
  name: '采购审批流程',
  category: 'purchase',
  entityType: 'Purchase',
  description: '采购申请审批流程',
  version: '1.0.0',
  definition: {
    nodes: [
      {
        id: 'start',
        type: 'startEvent',
        name: '提交采购申请',
        config: {
          formKey: 'purchase-approval-form'
        }
      },
      {
        id: 'dept-manager',
        type: 'userTask',
        name: '部门经理审批',
        config: {
          approvalConfig: {
            approvalType: 'single',
            approverSource: {
              type: 'role',
              value: 'department_manager'
            }
          }
        }
      },
      {
        id: 'gateway-1',
        type: 'exclusiveGateway',
        name: '金额判断',
        config: {
          gatewayConfig: {
            conditions: [
              {
                id: 'condition-1',
                name: '金额大于5万',
                expression: '${formData.amount > 50000}',
                targetNode: 'gm'
              },
              {
                id: 'condition-2',
                name: '金额小于等于5万',
                expression: '${formData.amount <= 50000}',
                targetNode: 'finance'
              }
            ]
          }
        }
      },
      {
        id: 'gm',
        type: 'userTask',
        name: '总经理审批',
        config: {
          approvalConfig: {
            approvalType: 'single',
            approverSource: {
              type: 'role',
              value: 'general_manager'
            }
          }
        }
      },
      {
        id: 'finance',
        type: 'userTask',
        name: '财务审批',
        config: {
          approvalConfig: {
            approvalType: 'single',
            approverSource: {
              type: 'role',
              value: 'finance_manager'
            }
          }
        }
      },
      {
        id: 'end-approved',
        type: 'endEvent',
        name: '审批通过'
      }
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'start',
        target: 'dept-manager',
        type: 'sequenceFlow'
      },
      {
        id: 'edge-2',
        source: 'dept-manager',
        target: 'gateway-1',
        type: 'sequenceFlow'
      },
      {
        id: 'edge-3',
        source: 'gateway-1',
        target: 'gm',
        type: 'sequenceFlow',
        condition: '${formData.amount > 50000}'
      },
      {
        id: 'edge-4',
        source: 'gateway-1',
        target: 'finance',
        type: 'sequenceFlow',
        condition: '${formData.amount <= 50000}'
      },
      {
        id: 'edge-5',
        source: 'gm',
        target: 'finance',
        type: 'sequenceFlow'
      },
      {
        id: 'edge-6',
        source: 'finance',
        target: 'end-approved',
        type: 'sequenceFlow'
      }
    ]
  },
  formSchema: [
    {
      name: 'purchase_name',
      label: '采购名称',
      type: 'text',
      required: true,
      placeholder: '请输入采购名称'
    },
    {
      name: 'amount',
      label: '采购金额(元)',
      type: 'number',
      required: true,
      placeholder: '请输入采购金额',
      min: 0
    },
    {
      name: 'purchase_reason',
      label: '采购原因',
      type: 'textarea',
      required: true,
      placeholder: '请输入采购原因',
      rows: 3
    },
    {
      name: 'supplier',
      label: '供应商',
      type: 'text',
      required: true,
      placeholder: '请输入供应商名称'
    },
    {
      name: 'expected_delivery_date',
      label: '预计交付日期',
      type: 'date',
      required: true
    }
  ]
};

/**
 * 设备入库流程模板
 */
export const EQUIPMENT_INBOUND_TEMPLATE: WorkflowTemplate = {
  id: 'equipment-inbound',
  name: '设备入库流程',
  category: 'equipment',
  entityType: 'EquipmentInbound',
  description: '设备入库审批流程',
  version: '1.0.0',
  definition: {
    nodes: [
      {
        id: 'start',
        type: 'startEvent',
        name: '提交入库申请',
        config: {
          formKey: 'equipment-inbound-form'
        }
      },
      {
        id: 'warehouse-manager',
        type: 'userTask',
        name: '仓库管理员审批',
        config: {
          approvalConfig: {
            approvalType: 'single',
            approverSource: {
              type: 'expression',
              value: '${formData.warehouse_manager_id}'
            }
          }
        },
        actions: {
          allowed: ['approve', 'reject', 'return', 'transfer', 'delegate', 'saveDraft'],
          defaultAction: 'approve'
        }
      },
      {
        id: 'create-equipment',
        type: 'serviceTask',
        name: '创建设备台账',
        config: {
          serviceType: 'equipmentInbound'
        }
      },
      {
        id: 'end-approved',
        type: 'endEvent',
        name: '审批通过'
      },
      {
        id: 'end-rejected',
        type: 'endEvent',
        name: '审批驳回'
      }
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'start',
        target: 'warehouse-manager',
        type: 'sequenceFlow'
      },
      {
        id: 'edge-2',
        source: 'warehouse-manager',
        target: 'create-equipment',
        type: 'sequenceFlow'
      },
      {
        id: 'edge-3',
        source: 'create-equipment',
        target: 'end-approved',
        type: 'sequenceFlow'
      }
    ]
  },
  formSchema: [
    {
      name: 'order_no',
      label: '入库单号',
      type: 'text',
      required: false,
      placeholder: '系统自动生成',
      disabled: true,
      readonly: true,
      group: '入库基础信息',
      visibleOn: ['start', 'warehouse-manager'],
      editableOn: []
    },
    {
      name: 'warehouse_id',
      label: '仓库',
      type: 'select',
      required: true,
      placeholder: '请选择仓库',
      group: '入库基础信息',
      dynamicOptions: 'warehouse',
      dynamicOptionsConfig: {
        source: '/api/warehouses',
        labelField: 'name',
        valueField: 'id'
      },
      visibleOn: ['start', 'warehouse-manager'],
      editableOn: ['start'],
      display: {
        type: 'select',
        format: 'label'
      }
    },
    {
      name: 'warehouse_manager_id',
      label: '仓库管理员',
      type: 'user',
      required: false,
      placeholder: '系统自动获取',
      disabled: true,
      readonly: true,
      visibleOn: ['start', 'warehouse-manager', 'equipment-manager'],
      editableOn: [],
      display: {
        type: 'user',
        format: 'name'
      },
      group: '入库基础信息'
    },
    {
      name: 'supplier',
      label: '供应商',
      type: 'text',
      required: false,
      placeholder: '请输入供应商名称',
      group: '入库基础信息',
      visibleOn: ['start', 'warehouse-manager'],
      editableOn: ['start']
    },
    {
      name: 'purchase_date',
      label: '采购日期',
      type: 'date',
      required: false,
      group: '入库基础信息',
      visibleOn: ['start', 'warehouse-manager'],
      editableOn: ['start']
    },

    {
      name: 'items',
      label: '设备明细',
      type: 'array',
      required: true,
      layout: { width: 'full' },
      group: '设备明细清单',
      visibleOn: ['start', 'warehouse-manager'],
      editableOn: ['start'],
      arrayConfig: {
        fields: [
          {
            name: 'category',
            label: '设备类别',
            type: 'select',
            required: true,
            placeholder: '请选择设备类别',
            options: [
              { label: '仪器', value: 'instrument' },
              { label: '假负载', value: 'fake_load' },
              { label: '独立配件', value: 'accessory' }
            ]
          },
          {
            name: 'equipment_name',
            label: '设备名称',
            type: 'select',
            required: true,
            placeholder: '请选择设备名称',
            dynamicOptions: 'equipment_names',
            dynamicOptionsConfig: {
              source: '/api/equipment/names',
              labelField: 'name',
              valueField: 'name',
              allowManualInput: true
            },
            dependsOn: ['category']
          },
          {
            name: 'model_no',
            label: '设备型号',
            type: 'select',
            required: true,
            placeholder: '请选择设备型号',
            dynamicOptions: 'equipment_models',
            dynamicOptionsConfig: {
              source: '/api/equipment/models',
              labelField: 'model_no',
              valueField: 'model_no',
              allowManualInput: true,
              dependsOnField: 'equipment_name'
            },
            dependsOn: ['equipment_name', 'category']
          },
          {
            name: 'unit',
            label: '单位',
            type: 'select',
            required: false,
            placeholder: '请选择单位',
            defaultValue: '台',
            dynamicOptionsConfig: {
              source: '/api/metadata/enum-options/Unit'
            }
          },
          {
            name: 'quantity',
            label: '数量',
            type: 'number',
            required: true,
            placeholder: '请输入数量',
            defaultValue: 1
          },
          {
            name: 'purchase_price',
            label: '采购单价',
            type: 'number',
            required: false,
            placeholder: '请输入单价'
          },
          {
            name: 'is_independent_code',
            label: '管理策略',
            type: 'select',
            required: true,
            defaultValue: true,
            options: [
              { label: '独立编码 (一物一码)', value: true },
              { label: '汇总管理 (仅计数量)', value: false }
            ]
          },
          {
            name: 'manage_code',
            label: '管理编码',
            type: 'text',
            required: false,
            placeholder: '不填则系统自动生成'
          },
          {
            name: 'serial_numbers',
            label: '机身序列号',
            type: 'text',
            required: false,
            placeholder: '请输入机身序列号',
            visibleWhen: {
              field: 'category',
              notEquals: 'fake_load'
            }
          },
          {
            name: 'manufacturer',
            label: '品牌',
            type: 'text',
            required: false,
            placeholder: '请输入品牌',
            visibleWhen: {
              field: 'category',
              in: ['instrument', 'fake_load']
            }
          },
          {
            name: 'technical_params',
            label: '技术参数',
            type: 'textarea',
            required: false,
            placeholder: '请输入技术参数',
            rows: 2,
            visibleWhen: {
              field: 'category',
              in: ['instrument', 'fake_load']
            }
          },
          {
            name: 'certificate_no',
            label: '校准证书编号',
            type: 'text',
            required: false,
            placeholder: '请输入证书编号',
            visibleWhen: {
              field: 'category',
              equals: 'instrument'
            }
          },
          {
            name: 'certificate_issuer',
            label: '发证单位',
            type: 'text',
            required: false,
            placeholder: '请输入发证单位',
            visibleWhen: {
              field: 'category',
              equals: 'instrument'
            }
          },
          {
            name: 'certificate_expiry_date',
            label: '校准证书到期时间',
            type: 'date',
            required: false,
            placeholder: '请输入证书到期时间',
            visibleWhen: {
              field: 'category',
              equals: 'instrument'
            }
          },
          {
            name: 'item_notes',
            label: '备注',
            type: 'textarea',
            required: false,
            placeholder: '请输入备注',
            rows: 2,
            visibleWhen: {
              field: 'category',
              notIn: ['accessory']
            }
          },
          {
            name: 'images',
            label: '图片信息',
            type: 'images',
            required: false,
            placeholder: '请上传图片',
            accept: 'image/*'
          },
          {
            name: 'attachments',
            label: '附件',
            type: 'files',
            required: false,
            placeholder: '请上传附件',
            accept: '*',
            visibleWhen: {
              field: 'category',
              in: ['instrument', 'fake_load']
            }
          },
          {
            name: 'accessory_list',
            label: '配件清单',
            type: 'array',
            required: false,
            placeholder: '请添加配件清单',
            visibleWhen: {
              field: 'category',
              equals: 'instrument'
            },
            arrayConfig: {
              fields: [
                {
                  name: 'accessory_name',
                  label: '配件名称',
                  type: 'select',
                  required: true,
                  placeholder: '请选择或输入',
                  dynamicOptionsConfig: {
                    source: '/api/equipment/accessories/names',
                    labelField: 'name',
                    valueField: 'name',
                    allowManualInput: true
                  }
                },
                {
                  name: 'is_independent_code',
                  label: '管理策略',
                  type: 'select',
                  required: true,
                  defaultValue: false,
                  options: [
                    { label: '独立编码 (一物一码)', value: true },
                    { label: '汇总管理 (仅计数量)', value: false }
                  ]
                },
                {
                  name: 'accessory_manage_code',
                  label: '管理编码',
                  type: 'text',
                  required: false,
                  placeholder: '不填则系统自动生成'
                },
                {
                  name: 'accessory_model',
                  label: '规格型号',
                  type: 'select',
                  required: false,
                  placeholder: '不填则为空',
                  dynamicOptionsConfig: {
                    source: '/api/equipment/accessories/models',
                    labelField: 'model_no',
                    valueField: 'model_no',
                    allowManualInput: true,
                    dependsOnField: 'accessory_name'
                  },
                  dependsOn: ['accessory_name']
                },
                {
                  name: 'accessory_quantity',
                  label: '数量',
                  type: 'number',
                  required: true,
                  placeholder: '请输入数量',
                  defaultValue: 1
                },
                {
                  name: 'accessory_unit',
                  label: '单位',
                  type: 'select',
                  required: false,
                  placeholder: '请选择单位',
                  defaultValue: '个',
                  dynamicOptionsConfig: {
                    source: '/api/metadata/enum-options/Unit'
                  }
                },

                {
                  name: 'accessory_images',
                  label: '图片',
                  type: 'images',
                  required: false,
                  placeholder: '请上传配件图片',
                  accept: 'image/*'
                },
                {
                  name: 'accessory_notes',
                  label: '备注',
                  type: 'textarea',
                  required: false,
                  placeholder: '请输入备注',
                  rows: 2
                }
              ]
            }
          }
        ]
      }
    },
    {
      name: 'notes',
      label: '备注',
      type: 'textarea',
      required: false,
      layout: { width: 'full' },
      group: '其他说明',
      placeholder: '请输入备注信息',
      rows: 2,
      visibleOn: ['start', 'warehouse-manager'],
      editableOn: ['start']
    }
  ]
};

/**
 * 人员入职流程模板
 */
export const EMPLOYEE_ONBOARD_TEMPLATE: WorkflowTemplate = {
  id: 'personnel-onboard',
  name: '人员入职流程',
  category: 'hr',
  entityType: 'Employee',
  description: '新员工入职审批流程',
  version: '1.0.0',
  definition: {
    nodes: [
      {
        id: 'start',
        type: 'startEvent',
        name: '提交入职申请',
        config: {
          formKey: 'personnel-onboard-form'
        }
      },
      {
        id: 'hr-manager',
        type: 'userTask',
        name: 'HR经理审批',
        config: {
          approvalConfig: {
            approvalType: 'single',
            approverSource: {
              type: 'role',
              value: 'hr_manager'
            }
          }
        },
        actions: {
          allowed: ['approve', 'reject', 'return', 'transfer', 'delegate', 'saveDraft'],
          defaultAction: 'approve'
        }
      },
      {
        id: 'department-manager',
        type: 'userTask',
        name: '部门经理审批',
        config: {
          approvalConfig: {
            approvalType: 'single',
            approverSource: {
              type: 'expression',
              value: '${formData.department_id}'
            },
            skipCondition: 'no_department_manager'
          }
        },
        actions: {
          allowed: ['approve', 'reject', 'return', 'transfer', 'delegate', 'saveDraft'],
          defaultAction: 'approve'
        }
      },
      {
        id: 'gm',
        type: 'userTask',
        name: '总经理审批',
        config: {
          approvalConfig: {
            approvalType: 'single',
            approverSource: {
              type: 'role',
              value: 'admin'
            }
          }
        },
        actions: {
          allowed: ['approve', 'reject', 'return', 'transfer', 'delegate', 'saveDraft'],
          defaultAction: 'approve'
        }
      },
      {
        id: 'create-employee',
        type: 'serviceTask',
        name: '创建员工记录',
        config: {
          serviceType: 'createEmployee',
          serviceConfig: {
            entityType: 'Employee',
            dataMapping: {
              name: '${formData.employee_name}',
              gender: '${formData.gender}',
              employee_no: '${formData.employee_id}',
              department_id: '${formData.department_id}',
              position: '${formData.position_id}',
              phone: '${formData.phone}',
              email: '${formData.email}',
              hire_date: '${formData.start_date}',
              status: 'active'
            }
          }
        }
      },
      {
        id: 'end-approved',
        type: 'endEvent',
        name: '审批通过'
      }
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'start',
        target: 'hr-manager',
        type: 'sequenceFlow'
      },
      {
        id: 'edge-2',
        source: 'hr-manager',
        target: 'department-manager',
        type: 'sequenceFlow'
      },
      {
        id: 'edge-3',
        source: 'department-manager',
        target: 'gm',
        type: 'sequenceFlow'
      },
      {
        id: 'edge-4',
        source: 'gm',
        target: 'create-employee',
        type: 'sequenceFlow'
      },
      {
        id: 'edge-5',
        source: 'create-employee',
        target: 'end-approved',
        type: 'sequenceFlow'
      }
    ]
  },
  formSchema: [
    {
      name: 'employee_id',
      label: '员工编号',
      type: 'text',
      required: false,
      placeholder: '系统自动生成',
      disabled: true,
      readonly: true,
      group: '员工个人资料',
      visibleOn: ['start', 'hr-manager', 'department-manager', 'gm'],
      editableOn: []
    },
    {
      name: 'employee_name',
      label: '姓名',
      type: 'text',
      required: true,
      placeholder: '请输入姓名',
      group: '员工个人资料',
      minLength: 2,
      maxLength: 50,
      visibleOn: ['start', 'hr-manager', 'department-manager', 'gm'],
      editableOn: ['start']
    },
    {
      name: 'gender',
      label: '性别',
      type: 'select',
      required: true,
      placeholder: '请选择性别',
      group: '员工个人资料',
      options: [
        { label: '男', value: 'male' },
        { label: '女', value: 'female' }
      ],
      visibleOn: ['start', 'hr-manager', 'department-manager', 'gm'],
      editableOn: ['start']
    },
    {
      name: 'phone',
      label: '手机号',
      type: 'text',
      required: true,
      placeholder: '请输入手机号',
      group: '员工个人资料',
      pattern: '^1[3-9]\\d{9}$',
      validation: {
        message: '手机号格式不正确'
      },
      visibleOn: ['start', 'hr-manager', 'department-manager', 'gm'],
      editableOn: ['start']
    },
    {
      name: 'email',
      label: '邮箱',
      type: 'text',
      required: false,
      placeholder: '请输入邮箱',
      group: '员工个人资料',
      pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
      validation: {
        message: '邮箱格式不正确'
      },
      visibleOn: ['start', 'hr-manager', 'department-manager', 'gm'],
      editableOn: ['start']
    },
    {
      name: 'id_card',
      label: '身份证号',
      type: 'text',
      required: false,
      placeholder: '请输入身份证号',
      group: '员工个人资料',
      pattern: '^[1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]$',
      validation: {
        message: '身份证号格式不正确'
      },
      visibleOn: ['start', 'hr-manager', 'department-manager', 'gm'],
      editableOn: ['start']
    },
    {
      name: 'department_id',
      label: '入职部门',
      type: 'select',
      required: true,
      placeholder: '请选择入职部门',
      group: '入职岗位信息',
      dynamicOptions: 'department',
      dynamicOptionsConfig: {
        source: '/api/organization/departments',
        labelField: 'name',
        valueField: 'id'
      },
      visibleOn: ['start', 'hr-manager', 'department-manager', 'gm'],
      editableOn: ['start'],
      display: {
        type: 'select',
        format: 'label'
      }
    },
    {
      name: 'position_id',
      label: '入职岗位',
      type: 'select',
      required: true,
      placeholder: '请选择入职岗位',
      group: '入职岗位信息',
      dynamicOptions: 'position',
      dynamicOptionsConfig: {
        source: '/api/organization/positions',
        labelField: 'name',
        valueField: 'id'
      },
      cascadeFrom: 'department_id',
      cascadeField: 'department_id',
      refEntity: 'positions',
      refLabel: 'name',
      refValue: 'id',
      visibleOn: ['start', 'hr-manager', 'department-manager', 'gm'],
      editableOn: ['start'],
      display: {
        type: 'select',
        format: 'label'
      }
    },
    {
      name: 'start_date',
      label: '入职日期',
      type: 'date',
      required: true,
      group: '入职岗位信息',
      visibleOn: ['start', 'hr-manager', 'department-manager', 'gm'],
      editableOn: ['start']
    },
    {
      name: 'employee_type',
      label: '员工性质',
      type: 'select',
      required: true,
      placeholder: '请选择员工性质',
      group: '入职岗位信息',
      options: [
        { label: '正式', value: 'regular' },
        { label: '实习', value: 'intern' },
        { label: '外包', value: 'outsourced' }
      ],
      visibleOn: ['start', 'hr-manager', 'department-manager', 'gm'],
      editableOn: ['start']
    },
    {
      name: 'notes',
      label: '备注',
      type: 'textarea',
      required: false,
      placeholder: '请输入备注信息',
      group: '补充说明',
      rows: 2,
      layout: { width: 'full' },
      visibleOn: ['start', 'hr-manager', 'department-manager', 'gm'],
      editableOn: ['start']
    }
  ]
};

/**
 * 设备维修流程模板
 */
export const EQUIPMENT_REPAIR_TEMPLATE: WorkflowTemplate = {
  id: 'equipment-repair',
  name: '设备维修流程',
  category: 'equipment',
  entityType: 'EquipmentRepair',
  description: '设备维修审批流程：包含位置负责人审批、发货拆分确认及归队收货。',
  formTemplateId: 'form-equipment-repair',
  version: '2.0.0',
  definition: {
    nodes: [
      {
        id: 'start',
        type: 'startEvent',
        name: '提交维修申请',
        config: {
          formKey: 'equipment-repair-form'
        }
      },
      {
        id: 'location-manager-ship',
        type: 'userTask',
        name: '位置管理员审批并核对发货',
        config: {
          approvalConfig: {
            approvalType: 'single',
            approverSource: {
              type: 'expression',
              value: '${formData.location_manager_id}'
            }
          },
          formKey: 'equipment-repair-shipping-form'
        },
        actions: {
          allowed: ['approve', 'reject', 'return', 'saveDraft'],
          defaultAction: 'approve'
        }
      },
      {
        id: 'service-task-shipping',
        type: 'serviceTask',
        name: '执行库存发货拆分',
        config: {
          serviceType: 'repair_shipping'
        }
      },
      {
        id: 'receiving',
        type: 'userTask',
        name: '维修完成并确认收货',
        config: {
          approvalConfig: {
            approvalType: 'single',
            approverSource: {
              type: 'expression',
              value: '${formData.location_manager_id}'
            }
          },
          formKey: 'equipment-repair-receiving-form'
        },
        actions: {
          allowed: ['approve', 'saveDraft'],
          defaultAction: 'approve'
        }
      },
      {
        id: 'service-task-receiving',
        type: 'serviceTask',
        name: '执行维修入库归队',
        config: {
          serviceType: 'repair_receiving'
        }
      },
      {
        id: 'end-approved',
        type: 'endEvent',
        name: '维修流程已完成'
      },
      {
        id: 'end-rejected',
        type: 'endEvent',
        name: '维修申请被驳回'
      }
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'location-manager-ship', type: 'sequenceFlow' },
      { id: 'e2', source: 'location-manager-ship', target: 'service-task-shipping', type: 'sequenceFlow', condition: '${action === "approve"}' },
      { id: 'e3', source: 'location-manager-ship', target: 'end-rejected', type: 'sequenceFlow', condition: '${action === "reject"}' },
      { id: 'e4', source: 'service-task-shipping', target: 'receiving', type: 'sequenceFlow' },
      { id: 'e5', source: 'receiving', target: 'service-task-receiving', type: 'sequenceFlow', condition: '${action === "approve"}' },
      { id: 'e6', source: 'service-task-receiving', target: 'end-approved', type: 'sequenceFlow' }
    ]
  },
  formSchema: [
    {
      name: 'location_type',
      label: '位置类型',
      type: 'select',
      required: true,
      options: [
        { label: '仓库', value: 'warehouse' },
        { label: '项目', value: 'project' }
      ],
      group: '基本信息',
      visibleOn: ['start', 'location-manager-ship', 'receiving'],
      editableOn: ['start']
    },
    {
      name: 'location_id',
      label: '当前位置',
      type: 'select',
      dynamicOptions: 'location_type',
      required: true,
      group: '基本信息',
      businessConfig: {
        autoFill: true
      },
      visibleOn: ['start', 'location-manager-ship', 'receiving'],
      editableOn: ['start']
    },
    {
      name: 'location_manager_id',
      label: '管理员',
      type: 'user',
      required: true,
      readonly: true,
      group: '基本信息',
      businessConfig: {
        autoFill: true,
        autoFillSource: 'location_manager',
        dependsOn: ['location_type', 'location_id']
      },
      visibleOn: ['start', 'location-manager-ship', 'receiving'],
      editableOn: ['location-manager-ship', 'receiving']
    },
    {
      name: 'items',
      label: '维修明细',
      type: 'array',
      required: true,
      layout: { width: 'full' },
      group: '设备明细清单',
      visibleOn: ['start', 'location-manager-ship', 'receiving'],
      editableOn: ['start'],
      arrayConfig: {
        modalSelector: true,
        fields: [
          {
            name: 'equipment_id',
            label: '选择设备',
            type: 'select',
            required: true,
            placeholder: '从台账选择设备',
            dynamicOptionsConfig: {
              source: '/api/equipment/instances/by-location',
              labelField: 'equipment_name',
              valueField: 'id',
              dependsOn: ['location_type', 'location_id']
            }
          },
          {
            name: 'equipment_name',
            label: '设备名称',
            type: 'text',
            required: true,
            placeholder: '自动填充'
          },
          {
            name: 'model_no',
            label: '型号规格',
            type: 'text',
            required: false,
            placeholder: '自动填充'
          },
          {
            name: 'equipment_category',
            label: '分类',
            type: 'text',
            required: false,
            placeholder: '自动填充'
          },
          {
            name: 'quantity',
            label: '维修数量',
            type: 'number',
            required: true,
            defaultValue: 1
          },
          {
            name: 'fault_description',
            label: '故障描述',
            type: 'textarea',
            required: true,
            placeholder: '请输入故障现象'
          }
        ]
      }
    },
    {
      name: 'global_repair_notes',
      label: '整单维修说明',
      type: 'textarea',
      required: false,
      group: '故障信息',
      rows: 2,
      visibleOn: ['start', 'location-manager-ship', 'receiving'],
      editableOn: ['start']
    },
    {
      name: 'shipping_no',
      label: '物流单号',
      type: 'text',
      required: true,
      group: '发运信息',
      visibleOn: ['location-manager-ship', 'receiving'],
      editableOn: ['location-manager-ship']
    },
    {
      name: 'shipped_at',
      label: '发货时间',
      type: 'datetime',
      required: true,
      group: '发运信息',
      visibleOn: ['location-manager-ship', 'receiving'],
      editableOn: ['location-manager-ship']
    },
    {
      name: 'shipping_images',
      label: '发货照片预览',
      type: 'images',
      required: false,
      group: '发运信息',
      visibleOn: ['location-manager-ship', 'receiving'],
      editableOn: ['location-manager-ship']
    },
    {
      name: 'received_at',
      label: '收货时间',
      type: 'datetime',
      required: true,
      group: '收货信息',
      visibleOn: ['receiving'],
      editableOn: ['receiving']
    },
    {
      name: 'receiving_images',
      label: '收货照片',
      type: 'images',
      required: false,
      group: '收货信息',
      visibleOn: ['receiving'],
      editableOn: ['receiving']
    }
  ]
};

/**
 * 设备报废/售出流程模板
 */

export const EQUIPMENT_SCRAP_SALE_TEMPLATE: WorkflowTemplate = {
  id: 'equipment-scrap-sale',
  name: '设备报废/出售流程',
  category: 'equipment',
  entityType: 'EquipmentScrapSale',
  description: '设备报废或出售申请、管理员审核及财务/实物归档流程',
  version: '1.0.0',
  formTemplateId: 'form-equipment-scrap-sale',
  definition: {
    nodes: [
      {
        id: 'start',
        type: 'startEvent',
        name: '申请报废/出售'
      },
      {
        id: 'warehouse-manager',
        type: 'userTask',
        name: '管理员审核',
        approvalConfig: {
          approvalType: 'single',
          approverSource: {
            type: 'expression',
            value: '${formData.location_manager_id}'
          }
        },
        actions: {
          allowed: ['approve', 'reject', 'return', 'saveDraft'],
          defaultAction: 'approve'
        }
      },
      {
        id: 'service-task-archival',
        type: 'serviceTask',
        name: '执行设备归档',
        config: {
          serviceType: 'equipment_scrap_sale'
        }
      },
      {
        id: 'end-approved',
        type: 'endEvent',
        name: '流程已完成'
      },
      {
        id: 'end-rejected',
        type: 'endEvent',
        name: '申请被驳回'
      }
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'warehouse-manager', type: 'sequenceFlow' },
      { id: 'e2', source: 'warehouse-manager', target: 'service-task-archival', type: 'sequenceFlow', condition: '${action === "approve"}' },
      { id: 'e3', source: 'warehouse-manager', target: 'end-rejected', type: 'sequenceFlow', condition: '${action === "reject"}' },
      { id: 'e4', source: 'service-task-archival', target: 'end-approved', type: 'sequenceFlow' }
    ]
  },
  formSchema: [
    {
      name: 'location_type',
      label: '位置类型',
      type: 'select',
      required: true,
      options: [
        { label: '仓库', value: 'warehouse' },
        { label: '项目', value: 'project' }
      ],
      group: '基本信息',
      visibleOn: ['start', 'warehouse-manager'],
      editableOn: ['start']
    },
    {
      name: 'location_id',
      label: '当前位置',
      type: 'select',
      dynamicOptions: 'location_type',
      required: true,
      group: '基本信息',
      businessConfig: {
        autoFill: true
      },
      visibleOn: ['start', 'warehouse-manager'],
      editableOn: ['start']
    },
    {
      name: 'location_manager_id',
      label: '管理员',
      type: 'user',
      required: true,
      readonly: true,
      group: '基本信息',
      businessConfig: {
        autoFill: true,
        autoFillSource: 'location_manager',
        dependsOn: ['location_type', 'location_id']
      },
      visibleOn: ['start', 'warehouse-manager'],
      editableOn: ['warehouse-manager']
    },
    {
      name: 'type',
      label: '处理类型',
      type: 'select',
      required: true,
      group: '基本信息',
      options: [
        { label: '报废', value: 'scrap' },
        { label: '出售', value: 'sale' }
      ],
      visibleOn: ['start', 'warehouse-manager'],
      editableOn: ['start']
    },
    {
      name: 'items',
      label: '设备明细',
      type: 'array',
      required: true,
      group: '处理明细',
      visibleOn: ['start', 'warehouse-manager'],
      editableOn: ['start'],
      arrayConfig: {
        modalSelector: true,
        fields: [
          {
            name: 'equipment_id',
            label: '选择设备',
            type: 'select',
            required: true,
            placeholder: '从台账选择设备',
            dynamicOptionsConfig: {
              source: '/api/equipment/instances/by-location',
              labelField: 'equipment_name',
              valueField: 'id',
              dependsOn: ['location_type', 'location_id']
            }
          },
          {
            name: 'equipment_name',
            label: '设备名称',
            type: 'text',
            required: true,
            placeholder: '自动填充'
          },
          {
            name: 'model_no',
            label: '型号规格',
            type: 'text',
            required: false,
            placeholder: '自动填充'
          },
          {
            name: 'quantity',
            label: '数量',
            type: 'number',
            required: true,
            defaultValue: 1
          }
        ]
      }
    },
    {
      name: 'reason',
      label: '原因说明',
      type: 'textarea',
      required: true,
      group: '基本信息',
      visibleOn: ['start', 'warehouse-manager'],
      editableOn: ['start']
    },
    {
      name: 'buyer',
      label: '购买方',
      type: 'text',
      group: '出售信息',
      visibleOn: ['start', 'warehouse-manager'],
      editableOn: ['start'],
      visibleWhen: { field: 'type', equals: 'sale' }
    },
    {
      name: 'sale_price',
      label: '成交价格',
      type: 'number',
      group: '出售信息',
      visibleOn: ['start', 'warehouse-manager'],
      editableOn: ['start'],
      visibleWhen: { field: 'type', equals: 'sale' }
    }
  ]
};

/**
 * 里程碑审批流程模板
 */
export const MILESTONE_APPROVAL_TEMPLATE: WorkflowTemplate = {
  id: 'milestone-approval',
  name: '里程碑变更审批流程',
  category: 'project',
  entityType: 'Project',
  description: '项目里程碑设定与变更审批流程，审批通过后自动更新项目数据。',
  version: '1.0.0',
  definition: {
    nodes: [
      {
        id: 'start',
        type: 'startEvent',
        name: '提交里程碑变更申请'
      },
      {
        id: 'dept-manager',
        type: 'userTask',
        name: '部门经理审批',
        config: {
          approvalConfig: {
            approvalType: 'single',
            approverSource: {
              type: 'role',
              value: 'department_manager'
            }
          }
        },
        actions: {
          allowed: ['approve', 'reject', 'return', 'saveDraft'],
          defaultAction: 'approve'
        }
      },
      {
        id: 'update-milestones',
        type: 'serviceTask',
        name: '同步里程碑数据',
        config: {
          serviceType: 'updateProjectMilestones'
        }
      },
      {
        id: 'end-approved',
        type: 'endEvent',
        name: '审批已通过'
      },
      {
        id: 'end-rejected',
        type: 'endEvent',
        name: '审批已驳回'
      }
    ],
    edges: [
      { id: 'edge-1', source: 'start', target: 'dept-manager', type: 'sequenceFlow' },
      { id: 'edge-2', source: 'dept-manager', target: 'update-milestones', type: 'sequenceFlow', condition: '${action === "approve"}' },
      { id: 'edge-3', source: 'dept-manager', target: 'end-rejected', type: 'sequenceFlow', condition: '${action === "reject"}' },
      { id: 'edge-4', source: 'update-milestones', target: 'end-approved', type: 'sequenceFlow' }
    ]
  },
  formSchema: [
    {
      name: 'project_id',
      label: '项目ID',
      type: 'text',
      required: true,
      group: '基本信息',
      visibleOn: ['start', 'dept-manager'],
      editableOn: []
    },
    {
      name: 'project_name',
      label: '项目名称',
      type: 'text',
      group: '基本信息',
      visibleOn: ['start', 'dept-manager'],
      editableOn: []
    },
    {
      name: 'change_reason',
      label: '变更原因',
      type: 'textarea',
      required: true,
      group: '说明',
      visibleOn: ['start', 'dept-manager'],
      editableOn: ['start']
    },
    {
       name: 'milestones',
       label: '拟设定里程碑清单',
       type: 'array',
       layout: { width: 'full' },
       group: '清单预览',
       visibleOn: ['start', 'dept-manager'],
       editableOn: []
    }
  ]
};

/**
 * 里程碑结项审批流程模板
 */
export const MILESTONE_COMPLETION_TEMPLATE: WorkflowTemplate = {
  id: 'milestone-completion',
  name: '里程碑结项审批流程',
  category: 'project',
  entityType: 'Milestone',
  description: '里程碑结项审批流程，审批通过后自动将里程碑标记为完成并更新项目总进度。',
  version: '1.0.0',
  definition: {
    nodes: [
      {
        id: 'start',
        type: 'startEvent',
        name: '提交里程碑结项申请'
      },
      {
        id: 'admin-approve',
        type: 'userTask',
        name: '管理员审批',
        config: {
          approvalConfig: {
            approvalType: 'single',
            approverSource: {
              type: 'user',
              value: '1' // admin 用户 ID
            }
          }
        },
        actions: {
          allowed: ['approve', 'reject', 'return', 'saveDraft'],
          defaultAction: 'approve'
        }
      },
      {
        id: 'complete-milestone',
        type: 'serviceTask',
        name: '执行里程碑结项',
        config: {
          serviceType: 'completeMilestone'
        }
      },
      {
        id: 'end-approved',
        type: 'endEvent',
        name: '结项通过'
      },
      {
        id: 'end-rejected',
        type: 'endEvent',
        name: '结项驳回'
      }
    ],
    edges: [
      { id: 'edge-1', source: 'start', target: 'admin-approve', type: 'sequenceFlow' },
      { id: 'edge-2', source: 'admin-approve', target: 'complete-milestone', type: 'sequenceFlow', condition: '${action === "approve"}' },
      { id: 'edge-3', source: 'admin-approve', target: 'end-rejected', type: 'sequenceFlow', condition: '${action === "reject"}' },
      { id: 'edge-4', source: 'complete-milestone', target: 'end-approved', type: 'sequenceFlow' }
    ]
  },
  formSchema: [
    { name: 'project_id', label: '项目ID', type: 'text', required: true, group: '基本信息', visibleOn: ['start', 'admin-approve'], editableOn: [] },
    { name: 'project_name', label: '项目名称', type: 'text', group: '基本信息', visibleOn: ['start', 'admin-approve'], editableOn: [] },
    { name: 'milestoneId', label: '里程碑ID', type: 'text', required: true, group: '基本信息', visibleOn: ['start', 'admin-approve'], editableOn: [] },
    { name: 'milestone_name', label: '里程碑名称', type: 'text', group: '基本信息', visibleOn: ['start', 'admin-approve'], editableOn: [] },
    { name: 'completion_summary', label: '结项总结', type: 'textarea', required: true, group: '结项信息', visibleOn: ['start', 'admin-approve'], editableOn: ['start'] },
    { name: 'actualEndDate', label: '实际完成日期', type: 'date', required: true, group: '结项信息', visibleOn: ['start', 'admin-approve'], editableOn: ['start'] }
  ]
};

/**
 * 项目结项审批流程模板
 */
export const PROJECT_COMPLETION_TEMPLATE: WorkflowTemplate = {
  id: 'project-completion',
  name: '项目结项审批流程',
  category: 'project',
  entityType: 'Project',
  description: '项目结项审批流程，审批通过后自动更新项目状态为已完成。',
  version: '1.0.0',
  definition: {
    nodes: [
      {
        id: 'start',
        type: 'startEvent',
        name: '提交项目结项申请'
      },
      {
        id: 'admin-approve',
        type: 'userTask',
        name: '管理员审批',
        config: {
          approvalConfig: {
            approvalType: 'single',
            approverSource: {
              type: 'user',
              value: '1' // admin 用户 ID
            }
          }
        },
        actions: {
          allowed: ['approve', 'reject', 'return', 'saveDraft'],
          defaultAction: 'approve'
        }
      },
      {
        id: 'complete-project',
        type: 'serviceTask',
        name: '执行项目结项',
        config: {
          serviceType: 'completeProject'
        }
      },
      {
        id: 'end-approved',
        type: 'endEvent',
        name: '结项通过'
      },
      {
        id: 'end-rejected',
        type: 'endEvent',
        name: '结项驳回'
      }
    ],
    edges: [
      { id: 'edge-1', source: 'start', target: 'admin-approve', type: 'sequenceFlow' },
      { id: 'edge-2', source: 'admin-approve', target: 'complete-project', type: 'sequenceFlow', condition: '${action === "approve"}' },
      { id: 'edge-3', source: 'admin-approve', target: 'end-rejected', type: 'sequenceFlow', condition: '${action === "reject"}' },
      { id: 'edge-4', source: 'complete-project', target: 'end-approved', type: 'sequenceFlow' }
    ]
  },
  formSchema: [
    { name: 'projectId', label: '项目ID', type: 'text', required: true, group: '基本信息', visibleOn: ['start', 'admin-approve'], editableOn: [] },
    { name: 'projectName', label: '项目名称', type: 'text', group: '基本信息', visibleOn: ['start', 'admin-approve'], editableOn: [] },
    { name: 'completionDate', label: '结项日期', type: 'date', required: true, group: '结项信息', visibleOn: ['start', 'admin-approve'], editableOn: ['start'] },
    { name: 'summary', label: '项目总结', type: 'textarea', required: true, group: '结项信息', visibleOn: ['start', 'admin-approve'], editableOn: ['start'] },
    { name: 'deliverables', label: '交付成果', type: 'textarea', group: '结项信息', visibleOn: ['start', 'admin-approve'], editableOn: ['start'] },
    { name: 'achievements', label: '主要成果与收获', type: 'textarea', group: '结项信息', visibleOn: ['start', 'admin-approve'], editableOn: ['start'] },
    { name: 'lessonsLearned', label: '经验教训', type: 'textarea', group: '结项信息', visibleOn: ['start', 'admin-approve'], editableOn: ['start'] }
  ]
};

/**
 * 人员项目调拨审批流程模板
 */
export const PERSONNEL_TRANSFER_TEMPLATE: WorkflowTemplate = {
  id: 'personnel-project-transfer',
  name: '人员项目调拨审批流程',
  category: 'personnel',
  entityType: 'PersonnelTransfer',
  description: '人员跨项目调拨审批流程，审批通过后自动执行调拨操作。',
  version: '1.0.0',
  definition: {
    nodes: [
      {
        id: 'start',
        type: 'startEvent',
        name: '提交调拨申请'
      },
      {
        id: 'admin-approve',
        type: 'userTask',
        name: '管理员审批',
        config: {
          approvalConfig: {
            approvalType: 'single',
            approverSource: {
              type: 'user',
              value: '1' // admin 用户 ID
            }
          }
        },
        actions: {
          allowed: ['approve', 'reject', 'return', 'saveDraft'],
          defaultAction: 'approve'
        }
      },
      {
        id: 'do-transfer',
        type: 'serviceTask',
        name: '执行调拨',
        config: {
          serviceType: 'transferProjectPersonnel'
        }
      },
      {
        id: 'end-approved',
        type: 'endEvent',
        name: '调拨完成'
      },
      {
        id: 'end-rejected',
        type: 'endEvent',
        name: '调拨驳回'
      }
    ],
    edges: [
      { id: 'edge-1', source: 'start', target: 'admin-approve', type: 'sequenceFlow' },
      { id: 'edge-2', source: 'admin-approve', target: 'do-transfer', type: 'sequenceFlow', condition: '${action === "approve"}' },
      { id: 'edge-3', source: 'admin-approve', target: 'end-rejected', type: 'sequenceFlow', condition: '${action === "reject"}' },
      { id: 'edge-4', source: 'do-transfer', target: 'end-approved', type: 'sequenceFlow' }
    ]
  },
  formSchema: [
    { name: 'employeeId', label: '员工ID', type: 'text', required: true, group: '调拨信息', visibleOn: ['start', 'admin-approve'], editableOn: [] },
    { name: 'employee_name', label: '员工姓名', type: 'text', group: '调拨信息', visibleOn: ['start', 'admin-approve'], editableOn: [] },
    { name: 'sourceProjectId', label: '调出项目ID', type: 'text', group: '调拨信息', visibleOn: ['start', 'admin-approve'], editableOn: [] },
    { name: 'source_project_name', label: '调出项目', type: 'text', group: '调拨信息', visibleOn: ['start', 'admin-approve'], editableOn: [] },
    { name: 'targetProjectId', label: '调入项目ID', type: 'text', group: '调拨信息', visibleOn: ['start', 'admin-approve'], editableOn: [] },
    { name: 'target_project_name', label: '调入项目', type: 'text', group: '调拨信息', visibleOn: ['start', 'admin-approve'], editableOn: [] },
    { name: 'transferDate', label: '调拨日期', type: 'date', required: true, group: '调拨信息', visibleOn: ['start', 'admin-approve'], editableOn: ['start'] },
    { name: 'transfer_reason', label: '调拨原因', type: 'textarea', required: true, group: '说明', visibleOn: ['start', 'admin-approve'], editableOn: ['start'] }
  ]
};

/**
 * 流程模板服务类
 */
export class WorkflowTemplatesService {
  private static templates: WorkflowTemplate[] = [
    PROJECT_APPROVAL_TEMPLATE,
    EQUIPMENT_TRANSFER_TEMPLATE,
    EQUIPMENT_INBOUND_TEMPLATE,
    EQUIPMENT_REPAIR_TEMPLATE,
    EQUIPMENT_SCRAP_SALE_TEMPLATE,
    EMPLOYEE_ONBOARD_TEMPLATE,
    MILESTONE_APPROVAL_TEMPLATE,
    MILESTONE_COMPLETION_TEMPLATE,
    PROJECT_COMPLETION_TEMPLATE,
    PERSONNEL_TRANSFER_TEMPLATE
  ];

  /**
   * 获取所有流程模板
   */
  static getAllTemplates(): WorkflowTemplate[] {
    return this.templates;
  }

  /**
   * 根据ID获取流程模板
   */
  static getTemplateById(id: string): WorkflowTemplate | undefined {
    return this.templates.find(template => template.id === id);
  }

  /**
   * 根据分类获取流程模板
   */
  static getTemplatesByCategory(category: string): WorkflowTemplate[] {
    return this.templates.filter(template => template.category === category);
  }

  /**
   * 根据实体类型获取流程模板
   */
  static getTemplatesByEntityType(entityType: string): WorkflowTemplate[] {
    return this.templates.filter(template => template.entityType === entityType);
  }

  /**
   * 创建流程定义
   */
  static createDefinitionFromTemplate(templateId: string, variables?: any): WorkflowDefinition {
    const template = this.getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template with id ${templateId} not found`);
    }

    return {
      id: `def-${Date.now()}`,
      key: template.id,
      name: template.name,
      version: 1,
      category: template.category,
      entity_type: template.entityType,
      status: 'draft',
      node_config: {
        nodes: template.definition.nodes,
        edges: template.definition.edges
      },
      form_schema: template.formSchema,
      form_template_id: template.formTemplateId,
      variables: variables || {},
      created_by: 'system',
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  /**
   * 获取模板的表单模式
   */
  static getFormSchemaByTemplateId(templateId: string): any[] {
    const template = this.getTemplateById(templateId);
    if (!template) {
      throw new Error(`Template with id ${templateId} not found`);
    }
    return template.formSchema || [];
  }
}

export default WorkflowTemplatesService;
