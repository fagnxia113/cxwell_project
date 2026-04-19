import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import ModalDialog from '../../components/ModalDialog'

export interface TaskFormData {
  name: string
  status: string
  priority: string
  project_id: string
  assignee_id: string
  due_date: string
  description: string
}

interface TaskFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: TaskFormData) => Promise<void>
  initialValues?: Partial<TaskFormData>
  mode: 'create' | 'edit'
  projects: { id: string, name: string }[]
  employees: { id: string, name: string }[]
}

export default function TaskForm({
  isOpen,
  onClose,
  onSubmit,
  initialValues,
  mode,
  projects = [],
  employees = []
}: TaskFormProps) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState<TaskFormData>({
    name: '',
    status: 'todo',
    priority: 'medium',
    project_id: '',
    assignee_id: '',
    due_date: '',
    description: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (initialValues) {
      setFormData({
        name: initialValues.name || '',
        status: initialValues.status || 'todo',
        priority: initialValues.priority || 'medium',
        project_id: initialValues.project_id || '',
        assignee_id: initialValues.assignee_id || '',
        due_date: initialValues.due_date || '',
        description: initialValues.description || ''
      })
    }
  }, [initialValues])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit(formData)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? t('task_form.create_task') : t('task_form.edit_task')}
      size="lg"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            disabled={submitting}
          >
            {t('task_form.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? t('task_form.saving') : t('task_form.save')}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('task_form.task_name')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t('task_form.name_placeholder')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('task_form.status_label')} <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todo">{t('task_form.status_todo')}</option>
              <option value="in_progress">{t('task_form.status_in_progress')}</option>
              <option value="review">{t('task_form.status_review')}</option>
              <option value="completed">{t('task_form.status_completed')}</option>
              <option value="cancelled">{t('task_form.status_cancelled')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('task_form.priority_label')} <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="low">{t('task_form.priority_low')}</option>
              <option value="medium">{t('task_form.priority_medium')}</option>
              <option value="high">{t('task_form.priority_high')}</option>
              <option value="urgent">{t('task_form.priority_urgent')}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('task_form.related_project')}
            </label>
            <select
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('task_form.no_project')}</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>{proj.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('task_form.assign_to')}
            </label>
            <select
              value={formData.assignee_id}
              onChange={(e) => setFormData({ ...formData, assignee_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t('task_form.unassigned')}</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('task_form.due_date')}
          </label>
          <input
            type="date"
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('task_form.description')}
          </label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t('task_form.description_placeholder')}
          />
        </div>
      </form>
    </ModalDialog>
  )
}
