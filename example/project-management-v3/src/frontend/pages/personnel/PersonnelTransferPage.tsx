/**
 * 人员调拨申请页面
 * 功能：提交人员跨项目调拨申请
 */
import React, { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../../config/api'
import { apiClient } from '../../utils/apiClient'
import { useMessage } from '../../hooks/useMessage'
import { useTranslation } from 'react-i18next'

interface Employee {
  id: string
  name: string
  department: string
  position: string
  status: string
  current_project_id?: string
  current_project_name?: string
}

interface Project {
  id: string
  name: string
  status: string
}

export default function PersonnelTransferPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { success, warning, error: showError } = useMessage()
  
  const [employees, setEmployees] = useState<Employee[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // 表单数据
  const [formData, setFormData] = useState({
    employee_id: '',
    from_project_id: '',
    to_project_id: '',
    transfer_type: 'project_transfer',
    reason: '',
    planned_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [empResult, projResult] = await Promise.all([
        apiClient.get<any>(API_URL.DATA('Employee')),
        apiClient.get<any>(API_URL.DATA('Project'))
      ])
      
      if (empResult) {
        setEmployees(empResult.items || empResult.data || empResult || [])
      }
      if (projResult) {
        const projectItems = projResult.items || projResult.data || projResult || []
        setProjects(projectItems.filter((p: Project) => p.status === 'in_progress'))
      }
    } catch (error: any) {
      console.error(t('personnel.error.load_failed'), error)
      showError(error.message || t('personnel.error.load_failed'))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.employee_id || !formData.to_project_id) {
      warning(t('personnel.transfer.select_employee_hint'))
      return
    }

    const employee = employees.find(e => e.id === formData.employee_id)
    const toProject = projects.find(p => p.id === formData.to_project_id)

    setSubmitting(true)
    try {
      // 使用工作流API启动人员调拨流程
      const result = await apiClient.post<any>('/api/workflow/processes', {
        definitionKey: 'personnel_transfer',
        title: `${t('personnel.transfer.title')} - ${employee?.name}`,
        businessKey: formData.employee_id,
        variables: {
          employeeId: formData.employee_id,
          employeeName: employee?.name,
          fromProjectId: formData.from_project_id,
          fromProjectName: employee?.current_project_name,
          toProjectId: formData.to_project_id,
          toProjectName: toProject?.name,
          transferType: formData.transfer_type,
          reason: formData.reason,
          plannedDate: formData.planned_date
        }
      })

      if (result && (result.success || result.id)) {
        success(t('personnel.transfer.submit_success'))
        setFormData({
          employee_id: '',
          from_project_id: '',
          to_project_id: '',
          transfer_type: 'project_transfer',
          reason: '',
          planned_date: new Date().toISOString().split('T')[0]
        })
        navigate('/approvals')
      } else {
        showError(t('common.submit_failed') + ': ' + (result?.error || t('common.unknown_error')))
      }
    } catch (error: any) {
      console.error(t('common.submit_failed'), error)
      showError(error.message || t('common.submit_failed'))
    } finally {
      setSubmitting(false)
    }
  }

  const selectedEmployee = employees.find(e => e.id === formData.employee_id)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p className="text-gray-500 font-medium">{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-700">{t('personnel.transfer.title')}</h1>
        <p className="text-gray-500 mt-1">{t('personnel.action.transfer_desc')}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 选择人员 */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              {t('personnel.transfer.select_employee')} <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.employee_id}
              onChange={(e) => {
                const emp = employees.find(emp => emp.id === e.target.value)
                setFormData({
                  ...formData,
                  employee_id: e.target.value,
                  from_project_id: emp?.current_project_id || ''
                })
              }}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              required
            >
              <option value="">{t('personnel.transfer.select_employee_hint')}</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} - {emp.position} ({t(`personnel.status.${emp.status}`)})
                </option>
              ))}
            </select>
            {selectedEmployee && (
              <div className="mt-3 p-4 bg-blue-50/50 rounded-lg border border-blue-100/50 text-sm flex gap-6">
                <div>
                  <span className="text-blue-500 font-medium">{t('personnel.transfer.current_project')}:</span> 
                  <span className="ml-2 font-bold text-blue-900">{selectedEmployee.current_project_name || t('personnel.transfer.not_assigned')}</span>
                </div>
                <div>
                   <span className="text-blue-500 font-medium">{t('common.status')}:</span>
                   <span className="ml-2 font-bold text-blue-900">{t(`personnel.status.${selectedEmployee.status}`)}</span>
                </div>
              </div>
            )}
          </div>

          {/* 目标项目 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              {t('personnel.transfer.target_project')} <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.to_project_id}
              onChange={(e) => setFormData({ ...formData, to_project_id: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              required
            >
              <option value="">{t('personnel.transfer.select_project_hint')}</option>
              {projects.filter(p => p.id !== formData.from_project_id).map(proj => (
                <option key={proj.id} value={proj.id}>{proj.name}</option>
              ))}
            </select>
          </div>

          {/* 计划日期 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              {t('common.startTime')}
            </label>
            <input
              type="date"
              value={formData.planned_date}
              onChange={(e) => setFormData({ ...formData, planned_date: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* 调动原因 */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            {t('common.remark')} <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder={t('personnel.transfer.reason_placeholder')}
            rows={5}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            required
          />
        </div>

        {/* 提交按钮 */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
          >
            {t('common.back')}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-200"
          >
            {submitting ? t('personnel.action.updating') : t('workflow.action.submit')}
          </button>
        </div>
      </form>
    </div>
  )
}
