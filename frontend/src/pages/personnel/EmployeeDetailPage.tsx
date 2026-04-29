import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API_URL } from '../../config/api'
import { apiClient } from '../../utils/apiClient'
import { useMessage } from '../../hooks/useMessage'
import { useConfirm } from '../../hooks/useConfirm'
import { useTranslation } from 'react-i18next'

interface Employee {
  employeeId: string
  employeeNo: string
  name: string
  gender: 'male' | 'female'
  phone: string
  phoneCountryCode?: string
  email: string
  userId: string | null
  deptId: string | null
  position: string
  positionName?: string
  departmentName?: string
  status: 'active' | 'resigned' | 'probation'
  currentStatus: 'on_duty' | 'leave' | 'business_trip' | 'other'
  hireDate: string
  leaveDate: string | null
  role?: string
  avatarColor: string
  createTime: string
  updateTime: string
  dingtalkUserId?: string | null
  dingtalkDeptId?: string | null
  education?: string
  university?: string
}

interface Department {
  id: string
  name: string
}

interface Position {
  id: string
  name: string
}

interface UserInfo {
  id: string
  role: string
}

export default function EmployeeDetailPage() {
  const { t, i18n } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { success, error: showError } = useMessage()
  const { confirm } = useConfirm()

  const [employee, setEmployee] = useState<Employee | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Employee>>({})

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      setCurrentUser(JSON.parse(userStr))
    }
  }, [])

  useEffect(() => {
    if (id) {
      loadEmployeeData()
      loadPositions()
      loadDepartments()
    }
  }, [id])

  const loadEmployeeData = async () => {
    try {
      setLoading(true)
      const result = await apiClient.get<any>(API_URL.ORGANIZATION.EMPLOYEE_DETAIL(id!))

      if (result && (result.success || result.employeeId)) {
        const data = result.data || result
        setEmployee(data)
        setEditForm(data)
      } else {
        throw new Error(t('personnel.error.not_found'))
      }
    } catch (err: any) {
      showError(err.message || t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const loadPositions = async () => {
    try {
      const result = await apiClient.get<any>(API_URL.ORGANIZATION.POSITIONS)
      if (result && (result.success || Array.isArray(result))) {
        setPositions(result.data || result)
      }
    } catch (err) {
      console.error(t('personnel.error.load_positions'), err)
    }
  }

  const loadDepartments = async () => {
    try {
      const result = await apiClient.get<any>(API_URL.ORGANIZATION.DEPARTMENTS)
      if (result && (result.success || Array.isArray(result))) {
        setDepartments(result.data || result)
      }
    } catch (err) {
      console.error(t('personnel.error.load_departments'), err)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditForm(employee || {})
  }

  const handleSave = async () => {
    try {
      const result = await apiClient.put<any>(API_URL.ORGANIZATION.EMPLOYEE_UPDATE(id!), editForm)

      if (result && (result.success || result.employeeId)) {
        setEmployee(result.data || result)
        setIsEditing(false)
        success(t('common.success'))
      } else {
        throw new Error(t('common.error'))
      }
    } catch (err: any) {
      showError(err.message || t('common.error'))
    }
  }

  const handleDelete = async () => {
    if (!employee) return
    if (!(await confirm({
      title: t('common.confirm') + ' ' + t('common.delete'),
      content: `${t('common.delete')} "${employee.name}"?`,
      type: 'danger'
    }))) {
      return
    }

    try {
      const result = await apiClient.delete<any>(API_URL.ORGANIZATION.EMPLOYEE_DELETE(id!))
      if (result && (result.success || result.id)) {
        success(t('common.success'))
        navigate('/personnel')
      } else {
        throw new Error(t('common.error'))
      }
    } catch (err: any) {
      showError(err.message || t('common.error'))
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency: i18n.language === 'zh-CN' ? 'CNY' : 'USD'
    }).format(amount)
  }

  const getGenderLabel = (gender: string | null) => {
    if (!gender) return '-'
    const labels: Record<string, string> = {
      male: t('personnel.gender.male'),
      female: t('personnel.gender.female')
    }
    return labels[gender] || gender
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      active: { label: t('personnel.status.active'), color: 'bg-green-100 text-green-700' },
      resigned: { label: t('personnel.status.resigned'), color: 'bg-gray-100 text-gray-700' },
      probation: { label: t('personnel.status.probation'), color: 'bg-yellow-100 text-yellow-700' }
    }
    return labels[status] || { label: status, color: 'bg-gray-100 text-gray-700' }
  }

  const getCurrentStatusLabel = (status: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      on_duty: { label: t('personnel.status.on_duty'), color: 'bg-blue-100 text-blue-700' },
      leave: { label: t('personnel.status.leave'), color: 'bg-orange-100 text-orange-700' },
      business_trip: { label: t('personnel.status.business_trip'), color: 'bg-purple-100 text-purple-700' },
      other: { label: t('personnel.status.other'), color: 'bg-gray-100 text-gray-700' }
    }
    return labels[status] || { label: status, color: 'bg-gray-100 text-gray-700' }
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: t('personnel.roles.admin'),
      project_manager: t('personnel.roles.project_manager'),
      hr_manager: t('personnel.roles.hr_manager'),
      equipment_manager: t('personnel.roles.equipment_manager'),
      implementer: t('personnel.roles.implementer'),
      user: t('personnel.roles.user')
    }
    return labels[role] || role
  }

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'root'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <p className="text-red-700 mb-4">{t('personnel.error.not_found')}</p>
          <button
            onClick={() => navigate('/personnel')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('common.back')}
          </button>
        </div>
      </div>
    )
  }

  const statusInfo = getStatusLabel(employee.status)
  const currentStatusInfo = getCurrentStatusLabel(employee.currentStatus)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/personnel')}
          className="text-blue-600 hover:text-blue-800 text-sm transition-colors"
        >
          {t('sidebar.personnel')}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-700">{t('personnel.title')}</h1>
            <div className="flex gap-2">
              {isAdmin && (
                <>
                  {!isEditing ? (
                    <>
                      <button
                        onClick={handleEdit}
                        className="px-4 py-2 bg-slate-900 text-white rounded-md shadow-md hover:bg-slate-800 text-xs font-bold transition-all"
                      >
                        {t('common.edit')}
                      </button>
                      <button
                        onClick={handleDelete}
                        className="px-4 py-2 bg-white text-rose-600 border border-slate-200 rounded-md hover:bg-rose-50 text-xs font-bold transition-all"
                      >
                        {t('common.delete')}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 text-xs font-bold transition-all"
                      >
                        {t('common.save')}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 text-xs font-bold transition-all"
                      >
                        {t('common.cancel')}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 border-r border-gray-100 pr-8">
              <div className="flex flex-col items-center text-center">
                <div
                  className="w-20 h-20 rounded-lg flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-sm"
                  style={{ backgroundColor: employee.avatarColor || '#3B82F6' }}
                >
                  {employee.name.charAt(0)}
                </div>
                <h2 className="text-xl font-bold text-slate-900">{employee.name}</h2>
                <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{employee.employeeNo}</div>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusInfo.color} border border-current opacity-90`}>
                    {statusInfo.label}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${currentStatusInfo.color} border border-current opacity-90`}>
                    {currentStatusInfo.label}
                  </span>
                </div>
              </div>

              <div className="mt-8 space-y-6">
                <div>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-wider">{t('personnel.sections.contact')}</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="text-gray-400 mt-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] text-slate-400 font-bold mb-0.5">{t('personnel.fields.phone')}</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.phone || ''}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-100 rounded-md px-3 py-1.5 text-xs font-bold focus:ring-4 focus:ring-blue-600/5 transition-all outline-none focus:border-blue-500"
                          />
                        ) : (
                          <span className="text-xs font-bold text-slate-900">{employee.phone || '-'}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="text-gray-400 mt-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] text-slate-400 font-bold mb-0.5">{t('personnel.fields.email')}</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.email || ''}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-100 rounded-md px-3 py-1.5 text-xs font-bold focus:ring-4 focus:ring-blue-600/5 transition-all outline-none focus:border-blue-500"
                          />
                        ) : (
                          <span className="text-xs font-bold text-slate-900 break-all">{employee.email || '-'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-8">
              <section>
                <h3 className="text-xs font-bold text-slate-900 mb-4 border-l-2 border-blue-600 pl-3 uppercase tracking-wider">{t('personnel.sections.professional')}</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">{t('personnel.fields.dept')}</label>
                    {isEditing ? (
                      <select
                        value={editForm.deptId || ''}
                        onChange={(e) => setEditForm({ ...editForm, deptId: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-100 rounded-md px-3 py-1.5 text-xs font-bold focus:ring-4 focus:ring-blue-600/5 transition-all outline-none focus:border-blue-500"
                      >
                        <option value="">{t('common.search') + t('personnel.fields.dept')}</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-xs font-bold text-slate-900">{employee.departmentName || '-'}</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">{t('personnel.fields.position')}</label>
                    {isEditing ? (
                      <select
                        value={editForm.position || ''}
                        onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-100 rounded-md px-3 py-1.5 text-xs font-bold focus:ring-4 focus:ring-blue-600/5 transition-all outline-none focus:border-blue-500"
                      >
                        <option value="">{t('common.search') + t('personnel.fields.position')}</option>
                        {positions.map((pos) => (
                          <option key={pos.id} value={pos.id}>{pos.name}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-xs font-bold text-slate-900">{employee.positionName || '-'}</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t('personnel.fields.role')}</label>
                    {isEditing ? (
                      <select
                        value={editForm.role || ''}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                        className="w-full rounded-md border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 p-2 outline-none border transition-all bg-white"
                      >
                        <option value="user">{t('personnel.roles.user')}</option>
                        <option value="admin">{t('personnel.roles.admin')}</option>
                        <option value="project_manager">{t('personnel.roles.project_manager')}</option>
                        <option value="hr_manager">{t('personnel.roles.hr_manager')}</option>
                        <option value="equipment_manager">{t('personnel.roles.equipment_manager')}</option>
                        <option value="implementer">{t('personnel.roles.implementer')}</option>
                      </select>
                    ) : (
                      <div className="text-sm font-bold text-gray-900">{getRoleLabel(employee.role || '')}</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t('personnel.fields.hireDate')}</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editForm.hireDate?.split('T')[0] || ''}
                        onChange={(e) => setEditForm({ ...editForm, hireDate: e.target.value })}
                        className="w-full rounded-md border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 p-2 outline-none border transition-all bg-white"
                      />
                    ) : (
                      <div className="text-sm font-bold text-gray-900">{formatDate(employee.hireDate)}</div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{t('common.status')}</label>
                    {isEditing ? (
                      <select
                        value={editForm.status || ''}
                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                        className="w-full rounded-md border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 p-2 outline-none border transition-all bg-white"
                      >
                        <option value="active">{t('personnel.status.active')}</option>
                        <option value="resigned">{t('personnel.status.resigned')}</option>
                        <option value="probation">{t('personnel.status.probation')}</option>
                      </select>
                    ) : (
                      <div className="text-sm font-bold text-gray-900">{statusInfo.label}</div>
                    )}
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold text-slate-900 mb-4 border-l-2 border-blue-600 pl-3 uppercase tracking-wider">{t('personnel.sections.other')}</h3>
                <div className="bg-slate-50 rounded-lg p-5 grid grid-cols-2 gap-4 border border-slate-100">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">{t('personnel.fields.id')}</label>
                    <div className="text-[10px] font-bold text-slate-500 break-all select-all">{employee.employeeId}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">{t('personnel.fields.userId')}</label>
                    <div className="text-[10px] font-bold text-slate-500">{employee.userId || t('common.noData')}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">{t('personnel.fields.dingtalk_user_id')}</label>
                    <div className="text-[10px] font-bold text-slate-500">{employee.dingtalkUserId || t('common.noData')}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">{t('personnel.fields.dingtalk_dept_id')}</label>
                    <div className="text-[10px] font-bold text-slate-500">{employee.dingtalkDeptId || t('common.noData')}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">{t('common.startTime')}</label>
                    <div className="text-[10px] font-bold text-slate-600">{new Date(employee.createTime).toLocaleString(i18n.language)}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">{t('common.endTime')}</label>
                    <div className="text-[10px] font-bold text-slate-600">{new Date(employee.updateTime).toLocaleString(i18n.language)}</div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
