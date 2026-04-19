import { UnifiedFormTemplate } from '../../../services/UnifiedFormService.js';

export const taskFormTemplates: UnifiedFormTemplate[] = [
  {
    id: 'form-task-assigned',
    key: 'task-assigned-form',
    name: '任务派发表单',
    description: '将特定任务派发给指定执行人的表单',
    module: 'task',
    businessEntityType: 'Task',
    version: 1,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fields: [
      { name: 'title', label: '任务标题', type: 'text', required: true },
      { name: 'description', label: '任务描述', type: 'textarea', required: true },
      { name: 'assignee_id', label: '执行人', type: 'user', required: true },
      { name: 'priority', label: '优先级', type: 'select', options: [{ label: '高', value: 'high' }, { label: '中', value: 'medium' }, { label: '低', value: 'low' }], defaultValue: 'medium' },
      { name: 'due_date', label: '截止日期', type: 'date', required: true }
    ]
  }
];
