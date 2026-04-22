/**
 * 人员管理页面 - 现代�? * Premium High-Density List-Based UI
 */
import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  Search,
  Filter,
  User,
  Plus,
  Mail,
  Phone,
  Briefcase,
  Layers,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Activity,
  ShieldCheck,
  MoreHorizontal,
  Edit3,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  UserPlus,
  RefreshCcw,
  Building,
  X
} from 'lucide-react'
import { orgApi } from '../../api/orgApi'
import { useOrgStore } from '../../store/useOrgStore'
import { useMessage } from '../../hooks/useMessage'
import { useConfirm } from '../../hooks/useConfirm'
import { cn } from '../../utils/cn'
import { usePermission } from '../../contexts/PermissionContext'

interface Employee {
  employeeId: string
  employeeNo: string
  name: string
  gender: 'male' | 'female'
  phone: string
  email: string
  userId: string | null
  deptId: string | null
  position: string
  positionName?: string
  departmentName?: string
  status: 'active' | 'resigned' | 'probation'
  currentStatus: 'onDuty' | 'leave' | 'businessTrip' | 'other'
  hireDate: string
  leaveDate: string | null
  role: 'admin' | 'projectManager' | 'hrManager' | 'equipmentManager' | 'implementer' | 'user'
  dailyCost: number
  skills: any
  avatarColor: string
  createTime: string
  updateTime: string
}

interface Position {
  id: string
  name: string
}

interface Department {
  id: string
  name: string
}

const StatCard = ({ title, value, icon: Icon, color, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, type: 'spring', damping: 25 }}
    className="bg-white p-6 rounded-lg border border-slate-100/80 shadow-sm relative overflow-hidden group"
  >
    <div className={cn(
      "absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-[0.03]",
      color === 'blue' ? 'bg-blue-500' : color === 'emerald' ? 'bg-emerald-500' : color === 'amber' ? 'bg-amber-500' : 'bg-indigo-500'
    )} />
    <div className="flex items-center gap-5 relative z-10">
      <div className={cn(
        "p-4 rounded-2xl",
        color === 'blue' ? 'bg-blue-50 text-blue-600' :
          color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
            color === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
      )}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1.5">{title}</p>
        <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{value}</h3>
      </div>
    </div>
  </motion.div>
)

export default function PersonnelListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { success, error: showError } = useMessage()
  const { confirm } = useConfirm()
  const { hasButton } = usePermission()

  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: '', phone: '', email: '', department: '', position: '', status: 'active'
  })

  const [positions, setPositions] = useState<Position[]>([])

  const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; border: string; icon: any }> = {
    active: { label: t('personnel.status.active'), color: 'text-accent', bgColor: 'bg-accent/10', border: 'border-accent/20', icon: CheckCircle },
    inactive: { label: t('personnel.status.inactive'), color: 'text-slate-400', bgColor: 'bg-slate-50', border: 'border-slate-100', icon: XCircle },
    resigned: { label: t('personnel.status.resigned'), color: 'text-slate-400', bgColor: 'bg-slate-50', border: 'border-slate-100', icon: XCircle },
    on_leave: { label: t('personnel.status.leave'), color: 'text-amber-600', bgColor: 'bg-amber-50', border: 'border-amber-100', icon: Clock }
  }

  const { departments, fetchDepartments } = useOrgStore()

  useEffect(() => {
    loadPositions()
    fetchDepartments()
  }, [])

  useEffect(() => { loadEmployees() }, [page, searchTerm])

  const loadPositions = async () => {
    try {
      const res = await orgApi.getPositions({ pageSize: 1000 })
      setPositions(res.data.list || [])
    } catch (e) { }
  }

  const loadEmployees = async () => {
    try {
      setLoading(true)
      const res = await orgApi.getEmployees({
        pageNum: page,
        pageSize: 12,
        name: searchTerm || undefined
      })
      if (res && res.success) {
        setEmployees(res.data.list || [])
        setTotal(res.data.total || 0)
        setTotalPages(Math.ceil((res.data.total || 0) / 12))
      }
    } catch (e: any) { showError(e.message || t('personnel.error.load_failed')) } finally { setLoading(false) }
  }

  const getDepartmentName = (id: string) => {
    if (!id) return '-'
    const strId = String(id)
    const findDept = (nodes: any[]): any => {
      for (const node of nodes) {
        if (String(node.id) === strId) return node
        if (node.children) {
          const found = findDept(node.children)
          if (found) return found
        }
      }
      return null
    }
    return findDept(departments)?.name || '-'
  }

  const getPositionName = (id: string) => {
    if (!id) return '-'
    const strId = String(id)
    const pos = positions.find(p => String(p.id) === strId)
    return pos?.name || pos?.postName || '-'
  }

  const stats = useMemo(() => ({
    total: total,
    active: employees.filter(e => e.status === 'active').length,
    growth: "+12.4%",
    retention: "98%"
  }), [employees, total])

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setEditFormData({
      name: employee.name,
      phone: employee.phone || '',
      email: employee.email || '',
      department: employee.department_id,
      position: employee.position,
      status: employee.status
    })
    setShowEditModal(true)
  }

  const handleDelete = async (employee: Employee) => {
    if (!(await confirm({
      title: t('personnel.action.confirm_destroy'),
      content: t('personnel.action.destroy_desc', { name: employee.name }),
      type: 'danger'
    }))) return
    try {
      await apiClient.delete(API_URL.ORGANIZATION.EMPLOYEE_DELETE(employee.employeeId))
      success(t('personnel.error.delete_record'))
      loadEmployees()
    } catch (e: any) { showError(e.message) }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEmployee) return
    setSubmitting(true)
    try {
      await apiClient.put(API_URL.ORGANIZATION.EMPLOYEE_UPDATE(editingEmployee.employeeId), {
        name: editFormData.name,
        phone: editFormData.phone || null,
        email: editFormData.email || null,
        department_id: editFormData.department,
        position: editFormData.position,
        status: editFormData.status
      })
      success(t('personnel.error.update_success'))
      setShowEditModal(false)
      loadEmployees()
    } catch (e: any) { showError(e.message) } finally { setSubmitting(false) }
  }

  return (
    <div className="min-h-screen bg-mesh p-4 lg:p-6 space-y-4 animate-fade-in custom-scrollbar">
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg text-white">
              <User size={20} strokeWidth={2.5} />
            </div>
            {t('personnel.list_title')}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('personnel.list_subtitle')}</p>
        </div>

        <div className="flex gap-2">
          {hasButton('personnel:create') && (
          <button
            onClick={() => navigate('/approvals/new')}
            className="px-4 py-2 bg-primary text-white rounded-lg shadow-sm transition-all text-sm font-medium flex items-center gap-2 hover:brightness-110"
          >
            <UserPlus size={14} />
            <span>{t('personnel.action.apply_onboarding')}</span>
          </button>
          )}
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title={t('personnel.stats.total')} value={stats.total} icon={Layers} color="blue" delay={0.1} />
        <StatCard title={t('personnel.stats.active_count')} value={stats.active} icon={ShieldCheck} color="emerald" delay={0.2} />
        <StatCard title={t('common.growth_rate')} value={stats.growth} icon={TrendingUp} color="indigo" delay={0.3} />
        <StatCard title={t('common.retention_rate')} value={stats.retention} icon={CheckCircle} color="amber" delay={0.4} />
      </div>

      {/* Intelligence Filter Bar */}
      <div className="premium-card p-4 bg-white/60 backdrop-blur-xl border-none flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex-1 min-w-[200px] relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={14} />
          <input
            type="text"
            placeholder={t('personnel.search_placeholder')}
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
            className="input-standard pl-9 !py-2 text-sm bg-white/50 border-white focus:bg-white !rounded-lg w-full"
          />
        </div>

        <button
          onClick={() => loadEmployees()}
          className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400 hover:text-primary transition-all shadow-sm"
        >
          <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Premium Rows List */}
      <div className="space-y-2 pb-16">
        <div className="grid grid-cols-12 gap-3 px-4 py-2 text-xs font-medium text-slate-400">
          <div className="col-span-1">{t('personnel.fields.employee_no')}</div>
          <div className="col-span-3">{t('personnel.fields.info')}</div>
          <div className="col-span-2">{t('personnel.fields.dept')}</div>
          <div className="col-span-3">{t('personnel.fields.contact_info')}</div>
          <div className="col-span-2 text-center">{t('common.status')}</div>
          <div className="col-span-1"></div>
        </div>

        <AnimatePresence mode="popLayout">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="premium-card h-20 bg-white/40 animate-pulse border-none" />
            ))
          ) : employees.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-24 text-center space-y-6 bg-white/30 rounded-2xl border border-dashed border-slate-200">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <User size={48} />
              </div>
              <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-sm">{t('personnel.empty.no_records')}</p>
            </motion.div>
          ) : (
            employees.map((emp, idx) => {
              const statusCfg = STATUS_CONFIG[emp.status] || STATUS_CONFIG.active
              return (
                <motion.div
                  key={emp.employeeId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  onClick={() => navigate(`/personnel/${emp.employeeId}`)}
                  className="grid grid-cols-12 gap-4 px-8 py-5 items-center premium-card border-none bg-white hover:bg-slate-50 hover:shadow-xl hover:scale-[1.005] cursor-pointer transition-all group"
                >
                  <div className="col-span-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400 group-hover:text-primary transition-colors">
                      {emp.employeeNo || '-'}
                    </span>
                  </div>

                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary group-hover:bg-primary group-hover:text-white transition-all">
                      {emp.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 leading-none mb-1 group-hover:text-primary truncate">{emp.name}</h4>
                      <div className="flex items-center gap-1.5">
                        <Briefcase size={10} className="text-slate-300" />
                        <p className="text-[10px] font-medium text-slate-400">{getPositionName(emp.position)}</p>
                      </div>
                    </div>
                  </div>

                   <div className="col-span-2">
                    <div className="flex items-center gap-1.5">
                      <Building size={12} className="text-slate-300" />
                      <span className="text-xs font-medium text-slate-600 truncate">{getDepartmentName(emp.deptId)}</span>
                    </div>
                  </div>

                  <div className="col-span-3 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-slate-600 transition-colors">
                      <Mail size={10} />
                      <span className="text-[10px] font-medium truncate">{emp.email || '-'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Phone size={10} />
                      <span className="text-[10px] font-medium">{emp.phone || '-'}</span>
                    </div>
                  </div>

                  <div className="col-span-2 text-center">
                    <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border", statusCfg.bgColor, statusCfg.color, statusCfg.border)}>
                      {statusCfg.label}
                    </div>
                  </div>

                  <div className="col-span-1 text-right">
                    <div className="opacity-0 group-hover:opacity-100 transition-all flex items-center justify-end gap-1.5">
                      {hasButton('personnel:update') && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(emp); }}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-slate-100 transition-all"
                      >
                        <Edit3 size={14} strokeWidth={2.5} />
                      </button>
                      )}
                      {hasButton('personnel:delete') && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(emp); }}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-slate-100 transition-all"
                      >
                        <Trash2 size={14} strokeWidth={2.5} />
                      </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>

        {/* Improved Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-8 py-6 bg-white/40 backdrop-blur-md rounded-2xl border border-white mt-4">
            <div className="flex items-center gap-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                {t('common.total')}: <span className="text-slate-900">{total}</span>
              </div>
              <div className="h-3 w-px bg-slate-200" />
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {t('common.page')}: <span className="text-slate-900">{page} / {totalPages}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={(e) => { e.stopPropagation(); setPage(p => p - 1); }}
                className={cn(
                  "px-4 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-2 border text-[10px] font-bold uppercase tracking-wider",
                  page === 1 ? "bg-slate-50 border-slate-100 text-slate-300 pointer-events-none" : "bg-white border-slate-200 text-slate-600 hover:border-primary hover:text-primary"
                )}
              >
                <ChevronLeft size={14} strokeWidth={2.5} />
                {t('common.prev_page')}
              </button>
              <button
                disabled={page === totalPages}
                onClick={(e) => { e.stopPropagation(); setPage(p => p + 1); }}
                className={cn(
                  "px-4 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-2 border text-[10px] font-bold uppercase tracking-wider",
                  page === totalPages ? "bg-slate-50 border-slate-100 text-slate-300 pointer-events-none" : "bg-primary border-primary text-white hover:bg-primary/90"
                )}
              >
                {t('common.next_page')}
                <ChevronRight size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && editingEmployee && (
          <div className="modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="modal-content max-w-md"
            >
              <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{t('personnel.action.edit_employee')}</h2>
                  <p className="text-[10px] font-medium text-slate-400 mt-0.5">{t('personnel.action.transfer_desc')}</p>
                </div>
                <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleUpdate} className="p-6 space-y-5">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="form-label">{t('personnel.fields.name')}</label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="form-control"
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">{t('personnel.fields.dept')}</label>
                      <select
                        value={editFormData.department}
                        onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                        className="form-control"
                        required
                      >
                        <option value="">{t('common.search')} {t('personnel.fields.dept')}</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="form-label">{t('personnel.fields.position')}</label>
                      <select
                        value={editFormData.position}
                        onChange={(e) => setEditFormData({ ...editFormData, position: e.target.value })}
                        className="form-control"
                        required
                      >
                        <option value="">{t('common.search')} {t('personnel.fields.position')}</option>
                        {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="form-label">{t('personnel.fields.phone')}</label>
                      <input
                        type="tel"
                        value={editFormData.phone}
                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                        className="form-control"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="form-label">{t('personnel.fields.email')}</label>
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="form-control"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="form-label">{t('common.status')}</label>
                      <select
                        value={editFormData.status}
                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                        className="form-control"
                      >
                        <option value="active">{t('personnel.status.active')}</option>
                        <option value="inactive">{t('personnel.status.inactive')}</option>
                        <option value="on_leave">{t('personnel.status.leave')}</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={submitting} className="btn-secondary flex-1">
                    {submitting ? t('personnel.action.updating') : t('personnel.action.submit_update')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
