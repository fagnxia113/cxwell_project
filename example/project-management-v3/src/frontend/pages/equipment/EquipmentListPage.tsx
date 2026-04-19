import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Search,
  Filter,
  Plus,
  Box,
  Trash2,
  Package,
  ChevronRight,
  ChevronLeft,
  Building,
  User,
  Upload,
  BarChart3,
  RefreshCcw,
  Monitor,
  ArrowRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMessage } from '../../hooks/useMessage'
import { useConfirm } from '../../hooks/useConfirm'
import { apiClient } from '../../utils/apiClient'
import { cn } from '../../utils/cn'
import ExcelImportModal from '../../components/common/ExcelImportModal'

interface Equipment {
  id: string
  equipment_name: string
  model_no: string
  manufacturer: string | null
  category: string
  unit: string
  quantity: number
  serial_number: string | null
  manage_code: string
  health_status: string
  usage_status: string
  location_status: string
  location_name: string | null
  keeper_name: string | null
  brand: string | null
  purchase_date: string | null
  purchase_price: number | null
  supplier: string | null
  calibration_expiry: string | null
  main_image: string | null
  accessories: any[] | null
  notes?: string | null
}

export default function EquipmentListPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { success, error: showError } = useMessage()
  const { confirm } = useConfirm()

  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')

  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterHealthStatus, setFilterHealthStatus] = useState<string>('')
  const [filterUsageStatus, setFilterUsageStatus] = useState<string>('')
  const [filterLocationStatus, setFilterLocationStatus] = useState<string>('')
  const [filterLocationId, setFilterLocationId] = useState<string>('')
  const [locations, setLocations] = useState<Array<{ id: string, name: string }>>([])

  const [showImportModal, setShowImportModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [hoveredPhotoId, setHoveredPhotoId] = useState<string | null>(null)
  const [photoPosition, setPhotoPosition] = useState<{ showAbove: boolean; top: number; left: number } | null>(null)

  const pageSize = 15

  useEffect(() => { loadLocations() }, [])
  useEffect(() => {
    loadEquipment()
  }, [page, searchTerm, filterCategory, filterHealthStatus, filterUsageStatus, filterLocationStatus, filterLocationId])

  const loadLocations = async () => {
    try {
      const [warehouses, projects] = await Promise.all([
        apiClient.get<any>('/api/warehouses'),
        apiClient.get<any>('/api/projects')
      ])
      setLocations([
        ...(warehouses?.data || []).map((w: any) => ({ id: w.id, name: w.name })),
        ...(projects?.data || []).map((p: any) => ({ id: p.id, name: p.name }))
      ])
    } catch (e) {}
  }

  const loadEquipment = async () => {
    setLoading(true)
    try {
      const params: any = {
        page,
        pageSize,
        search: searchTerm || undefined,
        category: filterCategory || undefined,
        health_status: filterHealthStatus || undefined,
        usage_status: filterUsageStatus || undefined,
        location_status: filterLocationStatus || undefined,
        location_id: filterLocationId || undefined,
        merge: 'true'
      }
      const res = await apiClient.get<any>('/api/equipment/instances', params)
      if (res) {
        setEquipment(res.data || [])
        setTotalPages(res.totalPages || 1)
        setTotal(res.total || 0)
      }
    } catch (e: any) {
      showError(e.message || t('personnel.error.load_failed'))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!(await confirm({
      title: t('equipment.action.delete_confirm'),
      content: t('equipment.action.delete_warning'),
      type: 'danger'
    }))) return

    try {
      await apiClient.delete(`/api/equipment/instances/${id}`)
      success(t('common.success'))
      loadEquipment()
    } catch (e: any) {
      showError(e.message || t('common.error'))
    }
  }

  const getHealthStatusBadge = (status: string) => {
    const s = (status || 'normal').toLowerCase()
    const configs: any = {
      normal: { color: 'emerald', label: t('equipment.health_status.normal') },
      excellent: { color: 'emerald', label: t('equipment.health_status.normal') },
      good: { color: 'emerald', label: t('equipment.health_status.normal') },
      affected: { color: 'amber', label: t('equipment.health_status.affected') },
      fair: { color: 'amber', label: t('equipment.health_status.affected') },
      broken: { color: 'rose', label: t('equipment.health_status.broken') },
      poor: { color: 'rose', label: t('equipment.health_status.broken') }
    }
    const config = configs[s] || configs.normal
    return (
      <span className={cn(
        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase border",
        config.color === 'emerald' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
        config.color === 'amber' ? "bg-amber-50 text-amber-600 border-amber-100" :
        "bg-rose-50 text-rose-600 border-rose-100"
      )}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-mesh p-4 lg:p-8 space-y-8 animate-fade-in custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary text-white rounded-xl shadow-brand">
            <Package size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-700">
              {t('equipment.ledger_title')}
            </h1>
            <p className="text-secondary font-bold text-xs uppercase tracking-widest mt-0.5 opacity-70">
              {t('equipment.ledger_subtitle')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/equipment/statistics')}
            className="btn-ghost"
          >
            <BarChart3 size={16} /> {t('equipment.stats_title')}
          </button>
          <button
            onClick={() => navigate('/equipment/accessories')}
            className="btn-ghost"
          >
            <Box size={16} /> {t('equipment.accessory_mgmt')}
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="btn-primary"
          >
            <Upload size={16} /> {t('common.import')}
          </button>
          <button
            onClick={() => navigate('/equipment/new')}
            className="btn-secondary"
          >
            <Plus size={16} strokeWidth={2.5} /> {t('equipment.action.add')}
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="premium-card p-4 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[300px] relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={16} />
          <input
            type="text"
            placeholder={t('common.search_placeholder')}
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
            className="input-search"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "p-3 rounded-xl transition-all border flex items-center gap-2 text-[10px] font-black uppercase tracking-widest",
            showFilters ? "bg-primary text-white border-primary" : "btn-ghost"
          )}
        >
          <Filter size={16} />
          {t('common.filter')}
        </button>

        <button
          onClick={() => loadEquipment()}
          className="p-3 bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
        >
          <RefreshCcw size={16} />
        </button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="premium-card p-6 grid grid-cols-1 md:grid-cols-5 gap-6">
              {[
                { label: t('equipment.fields.category'), value: filterCategory, setter: setFilterCategory, options: ['instrument', 'fake_load', 'accessory'], prefix: 'equipment.category' },
                { label: t('equipment.fields.health_status'), value: filterHealthStatus, setter: setFilterHealthStatus, options: ['excellent', 'good', 'fair', 'poor', 'broken'], prefix: 'equipment.health_status' },
                { label: t('equipment.fields.usage_status'), value: filterUsageStatus, setter: setFilterUsageStatus, options: ['idle', 'in_use'], prefix: 'equipment.usage_status' },
                { label: t('equipment.fields.location_status'), value: filterLocationStatus, setter: setFilterLocationStatus, options: ['warehouse', 'in_project', 'repairing', 'transferring'], prefix: 'equipment.location_status' }
              ].map((f, i) => (
                <div key={i} className="space-y-2">
                  <label className="form-label">{f.label}</label>
                  <select
                    value={f.value}
                    onChange={(e) => { f.setter(e.target.value); setPage(1) }}
                    className="form-control"
                  >
                    <option value="">{t('common.all')}</option>
                    {f.options.map(opt => (
                      <option key={opt} value={opt}>{t(`${f.prefix}.${opt}`)}</option>
                    ))}
                  </select>
                </div>
              ))}
              <div className="space-y-2">
                <label className="form-label">{t('equipment.fields.keeper')}</label>
                <select
                  value={filterLocationId}
                  onChange={(e) => { setFilterLocationId(e.target.value); setPage(1) }}
                  className="form-control"
                >
                  <option value="">{t('common.all')}</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table Section */}
      <div className="premium-card p-0 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse table-fixed min-w-[2000px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-4 w-16 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">#</th>
                <th className="p-4 w-80 text-[10px] font-black text-primary uppercase tracking-widest sticky left-0 bg-slate-50/90 backdrop-blur z-20 border-r border-slate-100">{t('equipment.fields.name')}</th>
                <th className="p-4 w-48 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('equipment.fields.model')}</th>
                <th className="p-4 w-40 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('equipment.fields.manage_code')}</th>
                <th className="p-4 w-40 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('equipment.fields.sn')}</th>
                <th className="p-4 w-28 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('equipment.fields.quantity')}</th>
                <th className="p-4 w-32 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('equipment.fields.health')}</th>
                <th className="p-4 w-32 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('equipment.fields.status')}</th>
                <th className="p-4 w-56 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('equipment.fields.location')}</th>
                <th className="p-4 w-36 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('equipment.fields.keeper')}</th>
                <th className="p-4 w-40 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('equipment.fields.brand')}</th>
                <th className="p-4 w-36 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('equipment.fields.purchase_date')}</th>
                <th className="p-4 w-36 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('equipment.fields.price')}</th>
                <th className="p-4 w-36 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('equipment.fields.calibration_expiry')}</th>
                <th className="p-4 w-48 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('equipment.fields.notes')}</th>
                <th className="p-4 w-24 sticky right-0 bg-slate-50/90 backdrop-blur z-20 border-l border-slate-100 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={16} className="p-8 text-center bg-slate-50/10" />
                  </tr>
                ))
              ) : equipment.length === 0 ? (
                <tr>
                  <td colSpan={16} className="p-24 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-300">
                      <Package size={64} className="opacity-10" />
                      <p className="text-[10px] font-black uppercase tracking-widest">{t('equipment.empty.no_equipment')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                equipment.map((item, i) => (
                  <tr
                    key={item.id}
                    className="group hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/equipment/${item.id}`)}
                  >
                    <td className="p-4 text-center text-[11px] font-mono font-bold text-slate-300 group-hover:text-primary">{(page - 1) * pageSize + i + 1}</td>
                    <td className="p-4 sticky left-0 bg-white group-hover:bg-slate-50/80 z-10 transition-colors border-r border-slate-50 shadow-sm">
                      <div className="flex items-center gap-3 relative">
                        <div
                          className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg",
                            item.category === 'instrument' ? 'bg-primary shadow-brand' : 'bg-blue-600 shadow-blue-200'
                          )}
                          onMouseEnter={(e) => {
                            if (item.main_image) {
                              const rect = e.currentTarget.getBoundingClientRect()
                              setHoveredPhotoId(item.id)
                              setPhotoPosition({ showAbove: rect.top < 300, top: rect.top, left: rect.left })
                            }
                          }}
                          onMouseLeave={() => { setHoveredPhotoId(null); setPhotoPosition(null) }}
                        >
                          {item.category === 'instrument' ? <Monitor size={18} /> : <Box size={18} />}

                          <AnimatePresence>
                            {hoveredPhotoId === item.id && item.main_image && photoPosition && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: photoPosition.showAbove ? -10 : 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: photoPosition.showAbove ? -10 : 10 }}
                                className={cn(
                                  "absolute left-0 z-[100] p-2 bg-white rounded-2xl shadow-2xl border border-slate-100",
                                  photoPosition.showAbove ? "bottom-full mb-3" : "top-full mt-3"
                                )}
                              >
                                <img src={item.main_image} className="w-56 h-auto rounded-lg object-cover" alt="" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-slate-900 group-hover:text-primary truncate transition-colors">{item.equipment_name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase truncate">{item.manufacturer || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-bold text-slate-600 truncate block">{item.model_no || '-'}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] font-mono font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase">{item.manage_code || '-'}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] font-mono font-bold text-slate-400 truncate block">{item.serial_number || '-'}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-sm font-black text-slate-900">{item.quantity}</span>
                      <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase">{item.unit || 'PCS'}</span>
                    </td>
                    <td className="p-4 text-center">
                      {getHealthStatusBadge(item.health_status)}
                    </td>
                    <td className="p-4 text-center">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase border",
                        item.location_status === 'transferring' ? "bg-amber-50 text-amber-600 border-amber-100" :
                        item.location_status === 'warehouse' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        item.location_status === 'repairing' ? "bg-rose-50 text-rose-600 border-rose-100" :
                        "bg-blue-50 text-blue-600 border-blue-100"
                      )}>
                        {t(`equipment.location_status.${item.location_status || 'idle'}`)}
                      </span>
                    </td>
                    <td className="p-4">
                       <div className="flex items-center gap-2">
                          <Building size={14} className="text-slate-300" />
                          <span className="text-xs font-bold text-slate-700 truncate">{item.location_name || '-'}</span>
                       </div>
                    </td>
                    <td className="p-4">
                       <div className="flex items-center gap-2">
                          <User size={14} className="text-slate-300" />
                          <span className="text-xs font-bold text-slate-700 truncate">{item.keeper_name || '-'}</span>
                       </div>
                    </td>
                    <td className="p-4 text-xs font-bold text-slate-500 truncate">{item.brand || '-'}</td>
                    <td className="p-4">
                       <p className="text-[11px] font-black text-slate-400 uppercase">{item.purchase_date ? new Date(item.purchase_date).toLocaleDateString(i18n.language) : '-'}</p>
                    </td>
                    <td className="p-4 text-right">
                       <span className="text-sm font-black text-slate-900">{item.purchase_price ? `¥${item.purchase_price.toLocaleString()}` : '-'}</span>
                    </td>
                    <td className="p-4">
                       <p className="text-[11px] font-black text-rose-400 uppercase">{item.calibration_expiry ? new Date(item.calibration_expiry).toLocaleDateString(i18n.language) : '-'}</p>
                    </td>
                    <td className="p-4">
                       <p className="text-[11px] font-medium text-slate-400 italic truncate">{item.notes || '-'}</p>
                    </td>
                    <td className="p-4 sticky right-0 bg-white group-hover:bg-slate-50/80 z-10 transition-colors border-l border-slate-50 text-center">
                       <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleDelete(e, item.id)}
                            className="p-2 text-slate-300 hover:text-rose-600 hover:bg-white rounded-lg transition-all"
                          >
                             <Trash2 size={16} />
                          </button>
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                             <ArrowRight size={14} />
                          </div>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-slate-50/30 p-6 flex items-center justify-between border-t border-slate-100">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-4">
            <span>{t('equipment.stats.total_items')}: <b className="text-primary">{total}</b></span>
            <div className="w-1 h-3 bg-slate-200" />
            <span>{t('equipment.stats.current_page')}: <b className="text-primary">{page} / {totalPages}</b></span>
          </div>

          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:text-primary disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-2 shadow-sm"
            >
              <ChevronLeft size={16} /> {t('common.prev_page')}
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:text-primary disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-2 shadow-sm"
            >
              {t('common.next_page')} <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        importType="equipment"
        onImportSuccess={() => {
          loadEquipment()
          success(t('common.success'))
        }}
      />
    </div>
  )
}
