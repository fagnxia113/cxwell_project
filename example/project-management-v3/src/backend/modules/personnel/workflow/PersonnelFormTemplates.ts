import { UnifiedFormTemplate } from '../../../services/UnifiedFormService.js';

export const personnelFormTemplates: UnifiedFormTemplate[] = [
  {
    id: 'form-personnel-onboard',
    key: 'personnel-onboard-form',
    name: '人员入职表单',
    module: 'personnel',
    category: 'personnel',
    description: '人员入职表单，基于现有PersonnelOnboardPage组件',
    businessEntityType: 'Employee',
    version: 1,
    status: 'active',
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fields: [
      { id: 'field-employee-id', name: 'employee_id', label: '员工编号', type: 'text', required: false, placeholder: '系统自动生成', disabled: true, readonly: true },
      { id: 'field-employee-name', name: 'employee_name', label: '姓名', type: 'text', required: true, placeholder: '请输入姓名', minLength: 2, maxLength: 50 },
      { id: 'field-employee-gender', name: 'gender', label: '性别', type: 'select', required: true, options: [{ label: '男', value: 'male' }, { label: '女', value: 'female' }] },
      { id: 'field-employee-phone', name: 'phone', label: '手机号', type: 'text', required: true, pattern: '^1[3-9]\\d{9}$' },
      { id: 'field-employee-department', name: 'department_id', label: '入职部门', type: 'select', required: true, dynamicOptions: 'department' },
      { id: 'field-employee-position', name: 'position_id', label: '入职岗位', type: 'select', required: true, dynamicOptions: 'position', cascadeFrom: 'department_id' },
      { id: 'field-employee-start-date', name: 'start_date', label: '入职日期', type: 'date', required: true },
      { id: 'field-employee-type', name: 'employee_type', label: '员工性质', type: 'select', required: true, options: [{ label: '正式', value: 'regular' }, { label: '实习', value: 'intern' }, { label: '外包', value: 'outsourced' }] }
    ]
  },
  {
    id: 'form-personnel-leave',
    key: 'personnel-leave-form',
    name: '请假申请表单',
    module: 'personnel',
    category: 'attendance',
    description: '员工请假申请表单',
    businessEntityType: 'LeaveRequest',
    version: 1,
    status: 'active',
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fields: [
      { id: 'field-leave-employee', name: 'employee_id', label: '申请人', type: 'select', required: true, businessConfig: { module: 'personnel', entityType: 'Employee', lookupField: 'id', displayField: 'name', filter: { status: ['active', 'probation'] }, autoFill: true } },
      { id: 'field-leave-type', name: 'leave_type', label: '请假类型', type: 'select', required: true, options: [{ label: '事假', value: 'personal' }, { label: '病假', value: 'sick' }, { label: '年假', value: 'annual' }] },
      { id: 'field-leave-start', name: 'start_date', label: '开始日期', type: 'date', required: true },
      { id: 'field-leave-end', name: 'end_date', label: '结束日期', type: 'date', required: true },
      { id: 'field-leave-days', name: 'leave_days', label: '请假天数', type: 'number', required: true, min: 0.5, step: 0.5 },
      { id: 'field-leave-reason', name: 'leave_reason', label: '请假原因', type: 'textarea', required: true, rows: 3 }
    ]
  }
];
