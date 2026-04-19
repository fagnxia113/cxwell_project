import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  Warehouse,
  Plus,
  Search,
  Activity,
  CheckCircle2,
  X,
  Building2,
  Trash2,
  Server,
  Layers,
  Map,
  ShieldCheck,
  Settings2,
  ArrowUpRight,
  UserCheck,
  MapPin,
  ChevronRight,
  History,
  Layout
} from 'lucide-react'
import { API_URL } from '../../config/api'
import { apiClient } from '../../utils/apiClient'
import { useMessage } from '../../hooks/useMessage'
import { useConfirm } from '../../hooks/useConfirm'
import { cn } from '../../utils/cn'

interface WarehouseModel {
  id: string
  warehouse_no: string
  name: string
  type: 'main' | 'branch' | 'project'
  location: string
  address?: string
  manager_id?: string
  manager_name?: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

const StatCard = ({ title, value, icon: Icon, color, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, type: 'spring', damping: 25 }}
    className="premium-card p-4 relative overflow-hidden group border-none bg-white shadow-sm"
  >
    <div className="flex items-center gap-3 relative z-10">
      <div className={cn(
        "p-2 rounded-lg",
        color === 'rose' ? 'bg-rose-50 text-rose-600' :
        color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
        color === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
      )}>
        <Icon size={16} strokeWidth={2} />
      </div>
      <div>
        <p className="text-xs text-slate-400 leading-none mb-1">{title}</p>
        <h3 className="text-xl font-bold text-slate-800 leading-none">{value}</h3>
      </div>
    </div>
  </motion.div>
)

export default function WarehouseListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { success, error: showError } = useMessage()
  const { confirm } = useConfirm()

  const [warehouses, setWarehouses] = useState<WarehouseModel[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseModel | null>(null)

  useEffect(() => { loadWarehouses() }, [])

  const loadWarehouses = async () => {
    try {
      setLoading(true)
      const result = await apiClient.get<any>(`${API_URL.BASE}/api/warehouses`)
      if (result.success) {
        setWarehouses(result.data || [])
      }
    } catch (error: any) {
      showError(error.message || t('warehouse.load_failed'))
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setFormMode('create')
    setEditingWarehouse(null)
    setIsFormOpen(true)
  }

  const handleEdit = (warehouse: WarehouseModel) => {
    setFormMode('edit')
    setEditingWarehouse(warehouse)
    setIsFormOpen(true)
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const confirmed = await confirm({
      title: t('warehouse.delete_confirm_title'),
      content: t('warehouse.delete_confirm_content'),
      type: 'danger'
    })
    if (!confirmed) return
    try {
      const result = await apiClient.delete(`${API_URL.BASE}/api/warehouses/${id}`)
      if (result.success) {
        success(t('warehouse.warehouse_removed'))
        loadWarehouses()
      }
    } catch (error: any) {
      showError(error.message || t('warehouse.remove_failed'))
    }
  }

  const stats = useMemo(() => ({
    total: warehouses.length,
    active: warehouses.filter(w => w.status === 'active').length,
    main: warehouses.filter(w => w.type === 'main').length,
    projects: warehouses.filter(w => w.type === 'project').length
  }), [warehouses])

  const filteredWarehouses = useMemo(() => {
    return warehouses.filter(w => {
      const matchKeyword = w.name.toLowerCase().includes(keyword.toLowerCase()) ||
        (w.warehouse_no && w.warehouse_no.toLowerCase().includes(keyword.toLowerCase())) ||
        (w.location && w.location.toLowerCase().includes(keyword.toLowerCase()))
      const matchType = filterType ? w.type === filterType : true
      const matchStatus = filterStatus ? w.status === filterStatus : true
      return matchKeyword && matchType && matchStatus
    })
  }, [warehouses, keyword, filterType, filterStatus])

  return (
    <div className="min-h-screen bg-mesh p-4 lg:p-6 space-y-4 animate-fade-in custom-scrollbar">
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-2xl font-bold text-slate-700 flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg text-white shadow-brand">
              <Warehouse size={20} strokeWidth={2.5} />
            </div>
            {t('warehouse.page_title')}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('warehouse.page_subtitle')}</p>
        </motion.div>

        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-primary text-white rounded-lg shadow-sm transition-all text-sm font-medium flex items-center gap-2 hover:brightness-110"
        >
          <Plus size={14} />
          <span>{t('warehouse.add_warehouse')}</span>
        </button>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title={t('warehouse.total_warehouses')} value={stats.total} icon={Layers} color="rose" delay={0.1} />
        <StatCard title={t('warehouse.normal_operation')} value={stats.active} icon={ShieldCheck} color="emerald" delay={0.2} />
        <StatCard title={t('warehouse.central_hub')} value={stats.main} icon={Building2} color="indigo" delay={0.3} />
        <StatCard title={t('warehouse.project_warehouse')} value={stats.projects} icon={Map} color="amber" delay={0.4} />
      </div>

      {/* Intelligence Filter Bar */}
      <div className="premium-card p-4 bg-white/60 backdrop-blur-xl border-none flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex-1 min-w-[200px] relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={14} />
          <input
            type="text"
            placeholder={t('warehouse.search_placeholder')}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="input-standard pl-9 !py-2 text-sm bg-white/50 border-white focus:bg-white !rounded-lg w-full"
          />
        </div>

        <select
          className="input-standard !w-40 !py-2 text-xs font-medium !rounded-lg"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">{t('warehouse.all_types')}</option>
          <option value="main">{t('warehouse.type_hub')}</option>
          <option value="branch">{t('warehouse.type_branch')}</option>
          <option value="project">{t('warehouse.type_project')}</option>
        </select>

        <select
          className="input-standard !w-32 !py-2 text-xs font-bold !rounded-md"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">{t('warehouse.status_filter')}</option>
          <option value='active'>{t('warehouse.status_active')}</option>
          <option value='inactive'>{t('warehouse.status_inactive')}</option>
        </select>
      </div>

      {/* Premium List Table */}
      <div className="space-y-3">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-8 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
          <div className="col-span-1">{t('warehouse.col_id')}</div>
          <div className="col-span-4">{t('warehouse.col_name_type')}</div>
          <div className="col-span-2">{t('warehouse.col_location')}</div>
          <div className="col-span-2">{t('warehouse.col_manager')}</div>
          <div className="col-span-2 text-center">{t('warehouse.col_status')}</div>
          <div className="col-span-1 text-right">{t('warehouse.col_actions')}</div>
        </div>

        <AnimatePresence mode="popLayout">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="premium-card h-20 bg-white/40 animate-pulse border-none" />
            ))
          ) : filteredWarehouses.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center space-y-4 bg-white/30 rounded-xl border border-dashed border-slate-200">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <Warehouse size={32} />
              </div>
              <p className="text-slate-400 text-sm">{t('warehouse.no_data')}</p>
            </motion.div>
          ) : (
            filteredWarehouses.map((warehouse, idx) => (
              <motion.div
                key={warehouse.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                onClick={() => navigate(`/warehouses/${warehouse.id}`)}
                className="grid grid-cols-12 gap-3 px-4 py-3 items-center premium-card border-none bg-white hover:bg-slate-50 hover:shadow-md cursor-pointer transition-all group"
              >
                {/* Ref Node */}
                <div className="col-span-1">
                  <span className="text-xs font-mono text-slate-400 group-hover:text-rose-600 transition-colors">
                    {warehouse.warehouse_no?.replace('WH-', '') || idx + 100}
                  </span>
                </div>

                {/* Name */}
                <div className="col-span-4 flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white",
                    warehouse.type === 'main' ? 'bg-rose-600' :
                      warehouse.type === 'branch' ? 'bg-blue-600' : 'bg-slate-700'
                  )}>
                    {warehouse.type === 'main' ? <History size={14} /> :
                      warehouse.type === 'branch' ? <Server size={14} /> : <MapPin size={14} />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-medium text-slate-700 leading-none mb-1 group-hover:text-rose-600 truncate">{warehouse.name}</h4>
                    <p className="text-xs text-slate-400">{warehouse.type === 'main' ? t('warehouse.warehouse_type_main') : warehouse.type === 'branch' ? t('warehouse.warehouse_type_branch') : t('warehouse.warehouse_type_project')}</p>
                  </div>
                </div>

                {/* Location */}
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className="text-indigo-500/50" />
                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-wide truncate">{warehouse.location || 'Global'}</span>
                  </div>
                </div>

                {/* Manager */}
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                      <UserCheck size={12} />
                    </div>
                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-wide">{warehouse.manager_name || 'Standby'}</span>
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-2 flex justify-center">
                  <div className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-all",
                    warehouse.status === 'active' ? "bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm" : "bg-slate-50 text-slate-400 border-slate-100"
                  )}>
                    <div className={cn("w-1.5 h-1.5 rounded-full", warehouse.status === 'active' ? "bg-emerald-500" : "bg-slate-400")} />
                    {warehouse.status === 'active' ? t('warehouse.online') : t('warehouse.offline')}
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-1 text-right flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(warehouse); }}
                    className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                  >
                    <Plus size={18} className="rotate-45" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, warehouse.id)}
                    className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                  <div className="w-10 h-10 flex items-center justify-center text-slate-400 bg-white shadow-sm border border-slate-100 rounded-xl">
                    <ArrowUpRight size={18} strokeWidth={3} />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Modern Warehouse Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFormOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-xl relative overflow-hidden"
            >
              <div className="px-8 py-6 flex justify-between items-center bg-slate-50 border-b border-slate-100 relative">
                <div className="relative z-10">
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    {formMode === 'create' ? t('warehouse.create_warehouse') : t('warehouse.edit_warehouse')}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 flex items-center gap-2">
                    <ShieldCheck size={14} className="text-rose-600" />
                    {editingWarehouse?.warehouse_no || t('warehouse.warehouse_init')}
                  </p>
                </div>
                <button onClick={() => setIsFormOpen(false)} className="w-10 h-10 flex items-center justify-center bg-white shadow-sm border border-slate-100 hover:bg-rose-50 hover:border-rose-100 group rounded-lg transition-all relative z-10">
                  <X size={20} className="text-slate-400 group-hover:text-rose-500 group-hover:rotate-90 transition-all" />
                </button>
              </div>

              <WarehouseModalInternal
                mode={formMode}
                initialValues={editingWarehouse}
                onClose={() => setIsFormOpen(false)}
                onSubmit={async (data: any) => {
                  const url = formMode === 'create'
                    ? `${API_URL.BASE}/api/warehouses`
                    : `${API_URL.BASE}/api/warehouses/${editingWarehouse?.id}`

                  const result: any = formMode === 'create'
                    ? await apiClient.post(url, data)
                    : await apiClient.put(url, data)

                  if (result.success || result.id) {
                    success(formMode === 'create' ? t('warehouse.deploy_success') : t('warehouse.update_success'))
                    loadWarehouses()
                    setIsFormOpen(false)
                  }
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function WarehouseModalInternal({ mode, initialValues, onClose, onSubmit }: any) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    warehouse_no: '',
    name: '',
    type: 'main' as any,
    location: '',
    address: '',
    manager_id: '',
    status: 'active' as any
  })
  const [employees, setEmployees] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const { error: showError } = useMessage()

  useEffect(() => {
    if (initialValues) setFormData(initialValues)
    loadEmployees()
  }, [initialValues])

  const loadEmployees = async () => {
    try {
      const result = await apiClient.get<any>(`${API_URL.BASE}/api/personnel/employees`)
      const data = result.data?.items || result.data || result.items || []
      setEmployees(data)
    } catch (error) { console.error(error) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit(formData)
    } catch (err: any) {
      showError(err.message || t('warehouse.operation_failed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-8 space-y-6">
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">{t('warehouse.warehouse_name')}</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2.5 text-sm font-bold focus:ring-4 focus:ring-rose-600/5 transition-all outline-none focus:border-rose-500"
          placeholder={t('warehouse.warehouse_name_placeholder')}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">{t('warehouse.warehouse_type')}</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            className="w-full bg-slate-50 border border-slate-100 rounded-lg px-4 py-2.5 text-sm font-bold focus:ring-4 focus:ring-rose-600/5 outline-none focus:border-rose-500"
          >
            <option value="main">{t('warehouse.type_main')}</option>
            <option value="branch">{t('warehouse.type_branch_label')}</option>
            <option value="project">{t('warehouse.type_project')}</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">{t('warehouse.col_location')}</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full bg-slate-50 border border-slate-100 rounded-lg pl-10 pr-4 py-2.5 text-sm font-bold focus:ring-4 focus:ring-rose-600/5 outline-none focus:border-rose-500"
              placeholder={t('warehouse.location_placeholder')}
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">{t('warehouse.col_manager')}</label>
        <div className="relative">
          <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
          <select
            value={formData.manager_id}
            onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
            className="w-full bg-slate-50 border border-slate-100 rounded-lg pl-10 pr-4 py-2.5 text-sm font-bold focus:ring-4 focus:ring-rose-600/5 outline-none focus:border-rose-500"
          >
            <option value="">{t('warehouse.pending')}</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">{t('warehouse.address')}</label>
        <div className="relative">
          <Map className="absolute left-4 top-3 text-slate-300" size={16} />
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full bg-slate-50 border border-slate-100 rounded-lg pl-10 pr-4 py-2.5 text-sm font-bold focus:ring-4 focus:ring-rose-600/5 min-h-[80px] resize-none outline-none focus:border-rose-500"
            placeholder={t('warehouse.address_placeholder')}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">{t('warehouse.run_status')}</label>
        <div className="grid grid-cols-2 gap-4">
          <button type="button" onClick={() => setFormData({ ...formData, status: 'active' })}
            className={cn("py-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all border-2",
              formData.status === 'active' ? "bg-slate-900 border-slate-900 text-white shadow-md" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200")}>
            {t('warehouse.status_active')}
          </button>
          <button type="button" onClick={() => setFormData({ ...formData, status: 'inactive' })}
            className={cn("py-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all border-2",
              formData.status === 'inactive' ? "bg-rose-600 border-rose-600 text-white shadow-md" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200")}>
            {t('warehouse.status_inactive')}
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t border-slate-50">
        <button type="button" onClick={onClose} className="px-6 py-2 font-bold text-xs text-slate-400 hover:text-slate-600">{t('warehouse.cancel')}</button>
        <button type="submit" disabled={submitting} className="px-10 py-2 bg-rose-600 text-white rounded-md font-bold text-xs shadow-md hover:bg-rose-700 active:scale-95 transition-all">
          {submitting ? t('warehouse.saving') : t('warehouse.submit')}
        </button>
      </div>
    </form>
  )
}
