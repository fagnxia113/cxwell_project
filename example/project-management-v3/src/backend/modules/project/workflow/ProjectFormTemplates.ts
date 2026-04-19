import { UnifiedFormTemplate } from '../../../services/UnifiedFormService.js';

export const projectFormTemplates: UnifiedFormTemplate[] = [
  {
    id: 'form-project-create',
    key: 'project-create-form',
    name: '项目创建表单',
    module: 'project',
    description: '项目立项审批表单',
    businessEntityType: 'Project',
    workflowTemplateId: 'project-approval',
    version: 1,
    status: 'active',
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fields: [
      {
        id: 'field-project-name',
        name: 'name',
        label: '项目名称',
        type: 'text',
        required: true,
        placeholder: '请输入项目名称',
        minLength: 2,
        maxLength: 100
      } as any,
      {
        id: 'field-project-code',
        name: 'code',
        label: '项目编号',
        type: 'text',
        required: false,
        placeholder: '系统自动生成',
        disabled: true,
        readonly: true
      } as any,
      {
        id: 'field-project-manager',
        name: 'manager_id',
        label: '项目经理',
        type: 'user',
        required: true,
        placeholder: '请选择项目经理'
      } as any,
      {
        id: 'field-project-start-date',
        name: 'start_date',
        label: '项目开始日期',
        type: 'date',
        required: true
      } as any,
      {
        id: 'field-project-end-date',
        name: 'end_date',
        label: '项目结束日期',
        type: 'date',
        required: false
      } as any,
      {
        id: 'field-project-country',
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
        ]
      } as any,
      {
        id: 'field-project-address',
        name: 'address',
        label: '项目地址',
        type: 'text',
        required: false,
        placeholder: '请输入项目地址'
      } as any,
      {
        id: 'field-project-status',
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
        ]
      } as any,
      {
        id: 'field-project-description',
        name: 'description',
        label: '项目描述',
        type: 'textarea',
        required: false,
        placeholder: '请输入项目描述信息',
        rows: 3
      } as any,
      {
        id: 'field-project-building-area',
        name: 'building_area',
        label: '建筑面积(m²)',
        type: 'number',
        required: false,
        min: 0
      } as any,
      {
        id: 'field-project-it-capacity',
        name: 'it_capacity',
        label: 'IT容量(MW)',
        type: 'number',
        required: false,
        min: 0
      } as any,
      {
        id: 'field-project-cabinet-count',
        name: 'cabinet_count',
        label: '机柜数量',
        type: 'number',
        required: false,
        min: 0
      } as any,
      {
        id: 'field-project-cabinet-power',
        name: 'cabinet_power',
        label: '单机柜功率(KW)',
        type: 'number',
        required: false,
        min: 0
      } as any,
      {
        id: 'field-project-power-architecture',
        name: 'power_architecture',
        label: '供电架构',
        type: 'textarea',
        required: false,
        placeholder: '供电系统架构描述',
        rows: 2
      } as any,
      {
        id: 'field-project-hvac-architecture',
        name: 'hvac_architecture',
        label: '暖通架构',
        type: 'textarea',
        required: false,
        placeholder: '暖通系统架构描述',
        rows: 2
      } as any,
      {
        id: 'field-project-fire-architecture',
        name: 'fire_architecture',
        label: '消防架构',
        type: 'textarea',
        required: false,
        placeholder: '消防系统架构描述',
        rows: 2
      } as any,
      {
        id: 'field-project-weak-electric-architecture',
        name: 'weak_electric_architecture',
        label: '弱电架构',
        type: 'textarea',
        required: false,
        placeholder: '弱电系统架构描述',
        rows: 2
      } as any,
      {
        id: 'field-project-customer',
        name: 'customer_id',
        label: '客户',
        type: 'lookup',
        required: false,
        placeholder: '请选择客户',
        businessConfig: {
          module: 'customer',
          entityType: 'Customer',
          lookupField: 'id',
          displayField: 'name',
          autoFill: true
        } as any
      } as any,
    ]
  },
  {
    id: 'form-milestone-adjustment',
    key: 'milestone-adjustment-form',
    name: '里程碑调整申请表',
    module: 'project',
    description: '里程碑节点变更申请表单',
    businessEntityType: 'Milestone',
    workflowTemplateId: 'milestone-adjustment',
    version: 1,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fields: [
      { id: 'f-m-project-id', name: 'projectId', label: '项目ID', type: 'text', disabled: true, required: true } as any,
      { id: 'f-m-milestone-id', name: 'milestoneId', label: '里程碑ID', type: 'text', disabled: true, required: true } as any,
      { id: 'f-m-name', name: 'name', label: '里程碑名称', type: 'text', required: true } as any,
      { id: 'f-m-old-start', name: 'plannedStartDate', label: '原开始日期', type: 'date', disabled: true } as any,
      { id: 'f-m-old-end', name: 'plannedEndDate', label: '原结束日期', type: 'date', disabled: true } as any,
      { id: 'f-m-new-start', name: 'newStartDate', label: '新开始日期', type: 'date', required: true } as any,
      { id: 'f-m-new-end', name: 'newEndDate', label: '新结束日期', type: 'date', required: true } as any,
      { id: 'f-m-reason', name: 'adjustmentReason', label: '调整原因', type: 'textarea', required: true } as any
    ]
  },
  {
    id: 'form-daily-report',
    key: 'daily-report-form',
    name: '每日工作日报',
    module: 'project',
    description: '员工每日工作内容提交表单',
    businessEntityType: 'DailyReport',
    workflowTemplateId: 'daily-report-submission',
    version: 1,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fields: [
      { id: 'f-dr-project', name: 'project_id', label: '关联项目', type: 'select', dynamicOptions: 'project' } as any,
      { id: 'f-dr-date', name: 'report_date', label: '日期', type: 'date', required: true } as any,
      { id: 'f-dr-content', name: 'work_content', label: '今日工作内容', type: 'textarea', required: true } as any,
      { id: 'f-dr-problems', name: 'problems', label: '遇到问题', type: 'textarea' } as any,
      { id: 'f-dr-plan', name: 'plan', label: '明日计划', type: 'textarea' } as any,
      { id: 'f-dr-hours', name: 'work_hours', label: '当日工时', type: 'number', defaultValue: 8 } as any,
      { id: 'f-dr-manager', name: 'manager_id', label: '审批人', type: 'user', required: true } as any
    ]
  },
  {
    id: 'form-material-upload',
    key: 'material-upload-form',
    name: '项目资料审批表',
    module: 'project',
    description: '关键资料上传审计表单',
    businessEntityType: 'Attachment',
    workflowTemplateId: 'project-material-upload',
    version: 1,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fields: [
      { id: 'f-mu-project', name: 'projectId', label: '关联项目ID', type: 'text', disabled: true } as any,
      { id: 'f-mu-name', name: 'materialName', label: '资料名称', type: 'text', required: true } as any,
      { id: 'f-mu-cat', name: 'category', label: '分类', type: 'select', options: [
        { label: '图纸', value: 'drawing' },
        { label: '合同', value: 'contract' },
        { label: '施工日志', value: 'construction_log' },
        { label: '验收文档', value: 'acceptance' }
      ] } as any,
      { id: 'f-mu-file', name: 'file_url', label: '附件上传', type: 'file', required: true } as any,
      { id: 'f-mu-pm', name: 'projectManagerId', label: '项目经理ID', type: 'text', hidden: true } as any
    ]
  }
];
