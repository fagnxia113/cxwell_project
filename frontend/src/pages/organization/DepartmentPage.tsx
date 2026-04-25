import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  ChevronRight,
  ChevronDown,
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  ShieldCheck,
  X,
  Layers,
  UserCheck,
  ArrowUpRight,
  Hash
} from 'lucide-react'
import { useOrgStore } from '../../store/useOrgStore'
import { useConfirm } from '../../hooks/useConfirm'
import { useMessage } from '../../hooks/useMessage'
import { orgApi } from '../../api/orgApi'
import { useTranslation } from 'react-i18next'
import { cn } from '../../utils/cn'
import { API_URL } from '../../config/api'
import { apiClient } from '../../utils/apiClient'

interface Department {
  id: string
  code: string
  name: string
  nameEn?: string
  parentId?: string
  managerId?: string
  managerName?: string
  level?: number
  sortOrder?: number
  status: string
  employeeCount?: number
  children?: Department[]
}

const StatCard = ({ title, value, icon: Icon, color, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, type: 'spring', damping: 25 }}
    className="premium-card p-6 relative overflow-hidden group border-none bg-white shadow-sm"
  >
    <div className={cn(
      "absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-[0.03] transition-transform group-hover:scale-150",
      color === 'blue' ? 'bg-blue-500' : color === 'emerald' ? 'bg-emerald-500' : color === 'amber' ? 'bg-amber-500' : 'bg-indigo-500'
    )} />
    <div className="flex items-center gap-5 relative z-10">
      <div className={cn(
        "p-4 rounded-xl shadow-inner",
        color === 'blue' ? 'bg-[#313a72]/10 text-[#313a72]' :
          color === 'emerald' ? 'bg-[#eaf6f1] text-[#00cc79]' :
            color === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-[#313a72]/5 text-[#4b648c]'
      )}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">{title}</p>
        <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-none">{value}</h3>
      </div>
    </div>
  </motion.div>
)

const DeptItem: React.FC<{
  dept: Department;
  level: number;
  onEdit: (d: Department) => void;
  onDelete: (id: string) => void;
  t: any;
}> = ({ dept, level, onEdit, onDelete, t }) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const hasChildren = dept.children && dept.children.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      layout
      className="select-none"
    >
      <div
        className={cn(
          "group flex items-center justify-between px-6 py-4 rounded-xl transition-all duration-200",
          "hover:bg-[#eaf6f1]/50 hover:shadow-sm",
          level > 0 && "border-l-2 border-[#00cc79]/20"
        )}
        style={{ marginLeft: level * 20 }}
      >
        <div className="flex items-center space-x-4">
          <div
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded-md cursor-pointer transition-colors",
              hasChildren ? "hover:bg-slate-200/50 bg-slate-50" : "opacity-0 pointer-events-none"
            )}
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>

          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center shadow-sm transition-transform group-hover:rotate-6",
            level === 0 ? "bg-[#313a72] text-white" : "bg-slate-100 text-slate-500"
          )}>
            <Building2 size={level === 0 ? 20 : 18} />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#313a72] tracking-tight group-hover:text-[#00cc79] transition-colors">{dept.name}</span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-mono text-slate-400 uppercase tracking-tighter">
                {dept.code}
              </span>
            </div>
            {dept.managerName && (
              <span className="text-[11px] text-slate-400 font-medium mt-0.5">{t('organization.dept.manager_label')}: {dept.managerName}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Hash size={12} />
            <span className="text-xs font-bold">{dept.employeeCount || 0}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(dept)}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={() => onDelete(dept.id)}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {dept.children!.map(child => (
              <DeptItem key={child.id} dept={child} level={level + 1} onEdit={onEdit} onDelete={onDelete} t={t} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const DepartmentPage: React.FC = () => {
  const { t } = useTranslation()
  const { departments, fetchDepartments, loading } = useOrgStore()
  const { confirm } = useConfirm()
  const { success } = useMessage()

  const [showModal, setShowModal] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    parentId: '',
    managerId: '',
    sortOrder: 0,
    description: ''
  })

  useEffect(() => {
    fetchDepartments()
  }, [])

  const handleOpenModal = (dept?: Department) => {
    if (dept) {
      setEditingDept(dept)
      setFormData({
        name: dept.name,
        nameEn: dept.nameEn || '',
        parentId: dept.parentId || '',
        managerId: dept.managerId || '',
        sortOrder: dept.sortOrder || 0,
        description: ''
      })
    } else {
      setEditingDept(null)
      setFormData({
        name: '',
        nameEn: '',
        parentId: '',
        managerId: '',
        sortOrder: 0,
        description: ''
      })
    }
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: t('organization.dept.delete_confirm_title'),
      content: t('organization.dept.delete_confirm_content'),
      type: 'danger'
    })
    if (!ok) return

    try {
      const res = await orgApi.deleteDept(id)
      if (res.success) {
        success(t('organization.dept.delete_success'))
        fetchDepartments()
      }
    } catch (err: any) {
      console.error(err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = editingDept
        ? await orgApi.updateDept(editingDept.id, formData)
        : await orgApi.createDept(formData)

      if (res.success) {
        success(editingDept ? t('organization.dept.update_success') : t('organization.dept.create_success'))
        setShowModal(false)
        fetchDepartments()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const flatList = useMemo(() => {
    const list: Department[] = []
    const flatten = (nodes: Department[]) => {
      nodes.forEach(n => {
        list.push(n)
        if (n.children) flatten(n.children)
      })
    }
    flatten(departments)
    return list
  }, [departments])

  const stats = useMemo(() => ({
    total: flatList.length,
    root: departments.length,
    employees: flatList.reduce((sum, d) => sum + (d.employeeCount || 0), 0),
    managers: flatList.filter(d => d.managerName).length
  }), [flatList, departments])

  const filteredDepartments = useMemo(() => {
    if (!searchTerm) return departments

    const filterNodes = (nodes: Department[]): Department[] => {
      return nodes.reduce((acc: Department[], node) => {
        const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (node.code && node.code.toLowerCase().includes(searchTerm.toLowerCase()))

        const filteredChildren = node.children ? filterNodes(node.children) : []

        if (matchesSearch || filteredChildren.length > 0) {
          acc.push({ ...node, children: filteredChildren })
        }

        return acc
      }, [])
    }

    return filterNodes(departments)
  }, [departments, searchTerm])

  return (
    <div className="min-h-screen bg-mesh p-4 lg:p-6 space-y-4 animate-fade-in custom-scrollbar">
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg text-white">
              <Building2 size={20} strokeWidth={2.5} />
            </div>
            {t('organization.dept.page_title')}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('organization.dept.page_subtitle')}</p>
        </motion.div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-primary text-white rounded-lg shadow-sm transition-all text-sm font-medium flex items-center gap-2 hover:brightness-110"
        >
          <Plus size={14} />
          <span>{t('organization.dept.add_dept')}</span>
        </button>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title={t('organization.dept.total_count')} value={stats.total} icon={Layers} color="blue" delay={0.1} />
        <StatCard title={t('organization.dept.root_count')} value={stats.root} icon={Building2} color="emerald" delay={0.2} />
        <StatCard title={t('organization.dept.employee_count')} value={stats.employees} icon={Users} color="amber" delay={0.3} />
        <StatCard title={t('organization.dept.manager_count')} value={stats.managers} icon={UserCheck} color="indigo" delay={0.4} />
      </div>

      {/* Intelligence Filter Bar */}
      <div className="premium-card p-4 bg-white/60 backdrop-blur-xl border-none flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex-1 min-w-[200px] relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={14} />
          <input
            type="text"
            placeholder={t('organization.dept.search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-standard pl-9 !py-2 text-sm bg-white/50 border-white focus:bg-white !rounded-lg w-full"
          />
        </div>
      </div>

      {/* Department Tree */}
      <div className="premium-card p-4 bg-white shadow-premium relative overflow-hidden">
        {loading && departments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
            <p className="text-slate-400 text-sm">{t('common.loading')}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredDepartments.length === 0 ? (
              <div className="text-center py-16 text-slate-400 flex flex-col items-center gap-3">
                <Building2 size={32} className="text-slate-200" />
                <p className="text-sm">{t('organization.dept.no_data')}</p>
              </div>
            ) : (
              filteredDepartments.map(dept => (
                <DeptItem
                  key={dept.id}
                  dept={dept}
                  level={0}
                  onEdit={handleOpenModal}
                  onDelete={handleDelete}
                  t={t}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Modern Department Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-xl relative overflow-hidden"
            >
              <div className="px-8 py-6 flex justify-between items-center bg-slate-50 border-b border-slate-100 relative">
                <div className="relative z-10">
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    {editingDept ? t('organization.dept.edit_title') : t('organization.dept.add_dept')}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 flex items-center gap-2">
                    <ShieldCheck size={14} className="text-blue-600" />
                    {editingDept?.code || t('organization.dept.new_code')}
                  </p>
                </div>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center bg-white shadow-sm border border-slate-100 hover:bg-rose-50 hover:border-rose-100 group rounded-lg transition-all relative z-10">
                  <X size={20} className="text-slate-400 group-hover:text-rose-500 group-hover:rotate-90 transition-all" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">{t('organization.dept.name_label')}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border-none rounded-xl px-5 py-3.5 text-sm font-bold focus:ring-4 focus:ring-blue-600/5 transition-all placeholder:text-slate-300"
                    placeholder="例如：技术研发中心"
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">{t('organization.dept.name_en_label')}</label>
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    className="w-full bg-slate-50 border-none rounded-xl px-5 py-3.5 text-sm font-bold focus:ring-4 focus:ring-blue-600/5 transition-all placeholder:text-slate-300"
                    placeholder="例如：Technology R&D Center"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">{t('organization.dept.parent_label')}</label>
                    <select
                      value={formData.parentId}
                      onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                      className="w-full bg-slate-50 border-none rounded-xl px-5 py-3.5 text-sm font-bold focus:ring-4 focus:ring-blue-600/5 appearance-none"
                    >
                      <option value="">{t('organization.dept.root_dept')}</option>
                      {flatList
                        .filter(d => !editingDept || d.id !== editingDept.id)
                        .map(dept => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">{t('organization.dept.sort_label')}</label>
                    <div className="relative">
                      <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input
                        type="number"
                        value={formData.sortOrder}
                        onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-50 border-none rounded-xl pl-12 pr-5 py-3.5 text-sm font-bold focus:ring-4 focus:ring-blue-600/5"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">{t('organization.dept.desc_label')}</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder={t('organization.dept.desc_placeholder')}
                    className="w-full bg-slate-50 border-none rounded-xl px-5 py-3.5 text-sm font-bold focus:ring-4 focus:ring-[#313a72]/5 resize-none"
                  />
                </div>

                 <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                  <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors">{t('common.cancel')}</button>
                  <button type="submit" className="px-10 py-2.5 bg-[#313a72] text-white rounded-xl font-bold shadow-lg shadow-[#313a72]/20 hover:bg-[#313a72]/90 transition-all">{t('common.save')}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DepartmentPage
