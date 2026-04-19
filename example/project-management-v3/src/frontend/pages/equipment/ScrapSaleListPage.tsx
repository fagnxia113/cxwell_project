import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Search,
  Archive,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileText,
  RotateCcw,
  DollarSign,
  ShieldAlert,
  Boxes
} from 'lucide-react'
import { apiClient } from '../../utils/apiClient'
import { useMessage } from '../../hooks/useMessage'
import { cn } from '../../utils/cn'

interface ArchiveEquipment {
  id: string
  equipment_name: string
  model_no: string
  brand?: string
  category: 'instrument' | 'fake_load' | 'accessory'
  tracking_type: 'SERIALIZED' | 'BATCH'
  quantity: number
  serial_number?: string
  unit?: string
  location_id?: string
  usage_status?: string
  health_status?: string
  location_status?: string
  manage_code: string
  created_at: string
  updated_at: string
  accessories?: any[]
  notes?: string
  manufacturer?: string
}

export default function ScrapSaleListPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { error: showError } = useMessage()
  
  const [orders, setOrders] = useState<ArchiveEquipment[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('')

  const pageSize = 15

  useEffect(() => {
    loadOrders()
  }, [page, searchTerm, filterType])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const params: any = { 
        page, 
        pageSize,
        keyword: searchTerm,
        usage_status: filterType || undefined
      }
      
      const result = await apiClient.get<any>('/api/equipment/v3/equipment/archives', params)
      if (result) {
        setOrders(result.data || [])
        setTotalPages(Math.ceil((result.total || 0) / pageSize))
        setTotal(result.total || 0)
      }
    } catch (e: any) {
      showError(e.message || t('personnel.error.load_failed'))
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const config: any = {
      'SCRAPPED': { label: t('equipment.location_status.scrapped'), color: 'rose' },
      'SOLD': { label: t('equipment.location_status.sold'), color: 'emerald' },
      'LOST': { label: t('equipment.location_status.lost'), color: 'amber' },
      'REPAIRING': { label: t('equipment.location_status.repairing'), color: 'indigo' }
    }
    const current = config[status] || { label: status, color: 'slate' }

    return (
      <div className={cn(
        "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-block",
        current.color === 'rose' ? "bg-rose-50 text-rose-600 border border-rose-100" :
        current.color === 'emerald' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
        current.color === 'amber' ? "bg-amber-50 text-amber-600 border border-amber-100" :
        current.color === 'indigo' ? "bg-indigo-50 text-indigo-600 border border-indigo-100" :
        "bg-slate-50 text-slate-500 border border-slate-200"
      )}>
        {current.label}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8 space-y-8 animate-fade-in custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 rounded-2xl shadow-xl text-white">
            <Archive size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-700">
              {t('equipment.archive_title')}
            </h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-0.5">
              {t('equipment.archive_subtitle')}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/equipment')}
          className="px-6 py-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 text-slate-600 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2 group shadow-sm"
        >
          <RotateCcw size={16} className="group-hover:-rotate-45 transition-transform" />
          {t('common.back')}
        </button>
      </div>

      {/* Control Bar */}
      <div className="premium-card p-4 bg-white border-none flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex bg-slate-50 p-1 rounded-xl gap-1 border border-slate-100">
          {['', 'SCRAPPED', 'SOLD', 'LOST'].map((s) => (
            <button
              key={s}
              onClick={() => { setFilterType(s); setPage(1) }}
              className={cn(
                "px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                filterType === s ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-500"
              )}
            >
              {s || t('common.all')}
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-[300px] relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={16} />
          <input
            type="text"
            placeholder={t('common.search_placeholder')}
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
            className="w-full pl-11 pr-4 py-3 text-xs font-bold bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 rounded-xl outline-none transition-all"
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="premium-card p-0 bg-white overflow-hidden border-none shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse table-fixed min-w-[1400px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-4 w-16 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">#</th>
                <th className="p-4 w-72 text-[10px] font-black text-slate-900 uppercase tracking-widest sticky left-0 bg-slate-50/90 backdrop-blur z-20 border-r border-slate-100">{t('equipment.fields.name')}</th>
                <th className="p-4 w-48 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('equipment.fields.model')}</th>
                <th className="p-4 w-32 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('equipment.fields.category')}</th>
                <th className="p-4 w-40 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('equipment.fields.manage_code')}</th>
                <th className="p-4 w-40 text-[10px) font-black text-slate-400 uppercase tracking-widest">{t('equipment.fields.sn')}</th>
                <th className="p-4 w-28 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('equipment.fields.quantity')}</th>
                <th className="p-4 w-32 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('equipment.fields.status')}</th>
                <th className="p-4 w-36 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('equipment.fields.archive_date')}</th>
                <th className="p-4 w-24 sticky right-0 bg-slate-50/90 backdrop-blur z-20 border-l border-slate-100"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={10} className="p-8 text-center bg-slate-50/20" />
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-24 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-300">
                      <Boxes size={48} className="opacity-20" />
                      <p className="text-[10px] font-black uppercase tracking-widest">{t('equipment.empty.no_equipment')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((item, i) => (
                  <tr
                    key={item.id}
                    className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/equipment/${item.id}`)}
                  >
                    <td className="p-4 text-center text-[11px] font-mono font-bold text-slate-300 group-hover:text-slate-900">{(page - 1) * pageSize + i + 1}</td>
                    <td className="p-4 sticky left-0 bg-white group-hover:bg-slate-50/80 z-10 transition-colors border-r border-slate-50 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg",
                          item.usage_status === 'SCRAPPED' ? 'bg-rose-500 shadow-rose-200' : 
                          item.usage_status === 'SOLD' ? 'bg-emerald-500 shadow-emerald-200' : 'bg-slate-500 shadow-slate-200'
                        )}>
                          {item.usage_status === 'SCRAPPED' ? <Trash2 size={18} /> : 
                           item.usage_status === 'SOLD' ? <DollarSign size={18} /> :
                           <ShieldAlert size={18} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-900 group-hover:text-blue-600 truncate transition-colors">{item.equipment_name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase truncate">{item.brand || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-bold text-slate-600 truncate block">{item.model_no || '-'}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-lg">{t(`equipment.category.${item.category}`)}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] font-mono font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{item.manage_code || '-'}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] font-mono font-bold text-slate-400 truncate block">{item.serial_number || '-'}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-sm font-black text-slate-900">{item.quantity}</span>
                      <span className="text-[10px] font-bold text-slate-400 ml-1">{item.unit || 'PCS'}</span>
                    </td>
                    <td className="p-4 text-center">
                      {getStatusBadge(item.usage_status || '')}
                    </td>
                    <td className="p-4 text-right">
                       <p className="text-[11px] font-black text-slate-400 uppercase">{new Date(item.updated_at).toLocaleDateString(i18n.language)}</p>
                    </td>
                    <td className="p-4 sticky right-0 bg-white group-hover:bg-slate-50/80 z-10 transition-colors border-l border-slate-50 text-center">
                       <button className="p-2 text-slate-300 hover:text-blue-600 transition-colors">
                          <FileText size={16} />
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-slate-50/30 p-4 flex items-center justify-between border-t border-slate-100">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-4">
            <span>{t('equipment.stats.total_items')}: <b className="text-slate-900">{total}</b></span>
            <div className="w-1 h-3 bg-slate-200" />
            <span>{t('equipment.stats.current_page')}: <b className="text-slate-900">{page} / {totalPages}</b></span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm"
            >
              <ChevronLeft size={18} strokeWidth={3} />
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm"
            >
              <ChevronRight size={18} strokeWidth={3} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
