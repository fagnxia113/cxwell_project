import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Boxes,
  Search,
  Plus,
  Filter,
  Trash2,
  MapPin,
  Tag,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Calendar,
  Layers,
  Link as LinkIcon,
  Activity,
  Database,
  ShieldCheck
} from 'lucide-react'
import { apiClient } from '../../utils/apiClient'
import { useMessage } from '../../hooks/useMessage'
import { useConfirm } from '../../hooks/useConfirm'
import { cn } from '../../utils/cn'

interface Accessory {
  id: string
  accessory_name: string
  model_no: string
  brand: string | null
  manufacturer: string | null
  category: 'instrument' | 'fake_load' | 'accessory' | 'general'
  unit: string
  quantity: number
  manage_code: string
  serial_number: string | null
  location_status: string 
  location_id: string
  location_name?: string
  keeper_id?: string
  keeper_name?: string
  health_status: string 
  usage_status: string 
  purchase_date: string | null
  purchase_price: number | null
  supplier: string | null
  calibration_expiry: string | null
  host_equipment_id?: string
  host_equipment_name?: string
}

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="premium-card p-5 relative overflow-hidden group border-none bg-white shadow-sm">
    <div className={cn(
      "absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-[0.05] transition-transform group-hover:scale-150",
      color === 'blue' ? 'bg-blue-500' : color === 'emerald' ? 'bg-emerald-500' : color === 'amber' ? 'bg-amber-500' : 'bg-indigo-500'
    )} />
    <div className="flex items-center gap-4 relative z-10">
      <div className={cn(
        "p-3 rounded-2xl shadow-sm",
        color === 'blue' ? 'bg-blue-50 text-blue-600' :
          color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
            color === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
      )}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        <h3 className="text-xl font-bold text-slate-900 mt-0.5 tracking-tight">{value}</h3>
      </div>
    </div>
  </div>
)

export default function AccessoryManagementPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { success, error: showError } = useMessage()
  const { confirm } = useConfirm()
  const [accessories, setAccessories] = useState<Accessory[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [filterHealth, setFilterHealth] = useState<string>('')
  const [filterUsage, setFilterUsage] = useState<string>('')
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    loadData()
  }, [page, filterHealth, filterUsage, keyword])

  const loadData = async () => {
    setLoading(true)
    try {
      const params: any = {
        page,
        pageSize: 15,
        category: 'accessory'
      }
      if (filterHealth) params.health_status = filterHealth
      if (filterUsage) params.usage_status = filterUsage
      if (keyword) params.keyword = keyword

      const response = await apiClient.get<any>('/api/equipment/instances', params)

      if (response && response.success) {
        setAccessories(response.data || [])
        setTotal(response.total || 0)
        setTotalPages(Math.ceil((response.total || 0) / 15))
      }
    } catch (error: any) {
      showError(error.message || t('personnel.error.load_failed'))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!(await confirm({
      title: t('equipment.action.confirm_delete'),
      content: t('equipment.action.delete_desc'),
      type: 'danger'
    }))) return
    try {
      await apiClient.delete(`/api/equipment/instances/${id}`)
      success(t('common.success'))
      loadData()
    } catch (err: any) {
      showError(err.message || t('common.error'))
    }
  }

  const stats = useMemo(() => {
    return {
      total: total,
      inStock: accessories.filter(a => a.location_status === 'warehouse').length,
      bound: accessories.filter(a => a.host_equipment_id).length,
      value: accessories.reduce((sum, a) => sum + (a.purchase_price || 0), 0)
    }
  }, [accessories, total])

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8 space-y-8 animate-fade-in custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-700">
            <Layers className="text-indigo-600" size={24} strokeWidth={2.5} />
            {t('equipment.accessory_mgmt')}
          </h1>
          <p className="text-slate-400 font-medium mt-1 text-xs">{t('equipment.ledger_subtitle')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/equipment')}
            className="px-4 py-2 bg-white text-slate-600 rounded-md shadow-sm border border-slate-200 transition-all font-bold text-xs hover:bg-slate-50"
          >
            {t('equipment.action.back_to_ledger')}
          </button>
          <button
            className="px-6 py-2 bg-indigo-600 text-white rounded-md shadow-md transition-all font-bold text-xs flex items-center gap-2 hover:bg-indigo-700"
          >
            <Plus size={18} />
            <span>{t('equipment.action.new_inbound')}</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('equipment.stats.total_items')} value={stats.total} icon={Boxes} color="blue" />
        <StatCard title={t('equipment.location_status.warehouse')} value={stats.inStock} icon={Database} color="emerald" />
        <StatCard title={t('equipment.action.bind')} value={stats.bound} icon={LinkIcon} color="amber" />
        <StatCard title={t('equipment.stats.total_value')} value={new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'CNY' }).format(stats.value)} icon={DollarSign} color="indigo" />
      </div>

      {/* Filters */}
      <div className="premium-card p-4 bg-white/60 backdrop-blur-md flex flex-wrap items-center gap-4 shadow-sm border-none">
        <div className="flex items-center gap-2 text-slate-400 px-3 border-r border-slate-200 mr-2">
          <Filter size={16} />
          <span className="text-[10px] font-bold uppercase tracking-wider">{t('common.filter')}</span>
        </div>

        <select
          className="input-standard !w-40 !py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600"
          value={filterHealth}
          onChange={(e) => setFilterHealth(e.target.value)}
        >
          <option value="">{t('equipment.fields.health')}</option>
          <option value="normal">{t('equipment.health.normal')}</option>
          <option value="broken">{t('equipment.health.broken')}</option>
        </select>

        <select
          className="input-standard !w-40 !py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600"
          value={filterUsage}
          onChange={(e) => setFilterUsage(e.target.value)}
        >
          <option value="">{t('equipment.fields.status')}</option>
          <option value="idle">{t('equipment.location_status.idle')}</option>
          <option value="in_use">{t('equipment.location_status.in_project')}</option>
        </select>

        <div className="flex-1 min-w-[200px] relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
          <input
            type="text"
            placeholder={t('common.search_placeholder')}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="input-standard pl-10 !py-2 text-xs font-medium !rounded-md border-slate-100"
          />
        </div>
      </div>

      {/* Table */}
      <div className="premium-card overflow-hidden bg-white/80 backdrop-blur-xl flex flex-col min-h-[500px] border-none shadow-sm">
        <div className="overflow-x-auto custom-scrollbar flex-1">
          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center gap-6">
               <Activity className="text-indigo-500 animate-spin" size={48} />
               <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{t('common.loading')}</p>
            </div>
          ) : accessories.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center text-center space-y-6">
              <Boxes className="text-slate-200" size={64} />
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">{t('equipment.empty.no_accessories')}</h2>
                <p className="text-slate-500 max-w-sm font-medium text-xs">{t('equipment.empty.desc')}</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">{t('equipment.fields.name')}</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">{t('equipment.fields.model')}</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">{t('equipment.fields.manage_code')}</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-center">{t('equipment.fields.quantity')}</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">{t('equipment.fields.location')}</th>
                  <th className="px-6 py-4 text-[10px) font-bold uppercase tracking-widest">{t('equipment.fields.status')}</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-center">{t('common.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence>
                  {accessories.map((item, idx) => (
                    <motion.tr
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-all cursor-pointer group"
                      onClick={() => navigate(`/equipment/accessory/${item.id}`)}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-inner transition-transform group-hover:scale-110",
                            item.category === 'instrument' ? 'bg-blue-50 text-blue-600' : 
                            item.category === 'fake_load' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'
                          )}>
                            {item.accessory_name?.charAt(0) || 'A'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block tracking-tight">{item.accessory_name}</span>
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5 uppercase">
                              <div className={cn("w-1.5 h-1.5 rounded-full", item.health_status === 'normal' ? 'bg-emerald-500' : 'bg-red-500')} />
                              {t(`equipment.category.${item.category || 'accessory'}`)}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                         <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-700 truncate">{item.model_no || 'N/A'}</p>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                            <Tag size={10} strokeWidth={3} />
                            {item.brand || 'OEM'}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-1.5">
                          <Database size={10} className="text-blue-500" />
                          <span className="text-[11px] font-bold font-mono text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 italic">
                            {item.manage_code || 'N/A'}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-center">
                        <div className="inline-flex flex-col items-center p-1.5 bg-slate-50 rounded-xl border border-slate-100 min-w-[60px]">
                           <p className="text-base font-black text-slate-900 leading-none">{item.quantity}</p>
                           <span className="text-[9px] font-black text-slate-400 uppercase mt-1 tracking-tighter">{item.unit || 'PCS'}</span>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="space-y-1.5">
                           <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                             <MapPin size={12} className="text-blue-500 shrink-0" />
                             <span className="truncate max-w-[120px]">{item.location_name || t('equipment.location_status.transit')}</span>
                           </div>
                           <div className={cn(
                             "w-fit px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider",
                             item.location_status === 'warehouse' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                             item.location_status === 'in_project' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                           )}>
                              {t(`equipment.location_status.${item.location_status || 'warehouse'}`)}
                           </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        {item.host_equipment_id ? (
                          <div className="space-y-1">
                             <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600">
                               <ShieldCheck size={12} />
                               <span className="truncate max-w-[120px]">{item.host_equipment_name}</span>
                             </div>
                             <span className="text-[9px] font-bold text-slate-300 uppercase italic font-mono tracking-tighter">{t('equipment.action.bind_success')}</span>
                          </div>
                        ) : (
                          <div className="space-y-1 opacity-60">
                             <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                               <LinkIcon size={12} className="rotate-45" />
                               <span>{t('equipment.location_status.idle')}</span>
                             </div>
                             <span className="text-[9px] font-bold text-slate-300 uppercase">{t('equipment.action.unbind')}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                           <button 
                            onClick={(e) => handleDelete(e, item.id)}
                            className="p-1.5 hover:bg-rose-50 rounded-md transition-all text-slate-300 hover:text-rose-600 border border-transparent hover:border-rose-100"
                          >
                            <Trash2 size={14} />
                          </button>
                          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                            <ChevronRight size={16} strokeWidth={3} />
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 bg-indigo-500 rounded-full" />
               {t('common.records')}: <span className="text-slate-900">{total}</span>
            </div>
            <div className="w-px h-4 bg-slate-200" />
            <div>
               {t('equipment.stats.current_page')}: <span className="text-indigo-600">{page}</span> / {totalPages}
            </div>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button 
                disabled={page === 1}
                onClick={(e) => { e.stopPropagation(); setPage(p => Math.max(1, p - 1)); }}
                className={cn(
                  "p-2 border rounded-lg transition-all shadow-sm flex items-center gap-2 px-6",
                  page === 1 ? "bg-slate-50 border-slate-100 text-slate-200 pointer-events-none" : "bg-white border-slate-200 text-slate-600 hover:border-indigo-500 hover:text-indigo-500 active:scale-95 hover:shadow-md"
                )}
              >
                <ChevronLeft size={16} strokeWidth={3} />
                <span className="text-[10px] font-black uppercase tracking-widest">{t('common.prev_page') || 'PREV'}</span>
              </button>
              
              <button 
                disabled={page === totalPages}
                onClick={(e) => { e.stopPropagation(); setPage(p => Math.min(totalPages, p + 1)); }}
                className={cn(
                  "p-2 border rounded-lg transition-all shadow-sm flex items-center gap-2 px-6",
                  page === totalPages ? "bg-slate-50 border-slate-100 text-slate-200 pointer-events-none" : "bg-white border-slate-200 text-slate-600 hover:border-indigo-500 hover:text-indigo-500 active:scale-95 hover:shadow-md"
                )}
              >
                <span className="text-[10px] font-black uppercase tracking-widest">{t('common.next_page') || 'NEXT'}</span>
                <ChevronRight size={16} strokeWidth={3} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
