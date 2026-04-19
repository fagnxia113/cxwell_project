import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  History, 
  Search, 
  Filter, 
  Calendar, 
  Package, 
  AlertCircle, 
  FileText,
  Activity,
  ArrowRightLeft,
  Wrench,
  Trash2,
  DollarSign,
  ChevronRight,
  ChevronLeft
} from 'lucide-react'
import { apiClient } from '../../utils/apiClient'
import { cn } from '../../utils/cn'

interface HistoryRecord {
  id: string
  equipment_id: string
  equipment_name: string
  model_no: string
  category: string
  action: string
  action_type: 'inbound' | 'transfer' | 'repair' | 'scrap' | 'sale'
  from_location?: string
  to_location?: string
  operator: string
  operated_at: string
  notes?: string
  order_no?: string
}

interface ScrapRecord {
  id: string
  order_no: string
  equipment_id: string
  equipment_name: string
  equipment_category: string
  type: 'scrap' | 'sale'
  reason: string
  applicant: string
  apply_date: string
  original_location_id: string
  original_location_type: string
  scrap_sale_quantity: number
  buyer?: string
  sale_price?: number
  status: string
}

type TabType = 'history' | 'scrap'

export default function EquipmentHistoryPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('history')
  const [records, setRecords] = useState<HistoryRecord[]>([])
  const [scrapRecords, setScrapRecords] = useState<ScrapRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 })

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory()
    } else {
      loadScrapList()
    }
  }, [activeTab, filterType, dateRange, pagination.page])

  const loadHistory = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (filterType !== 'all') params.type = filterType
      if (dateRange.start) params.startDate = dateRange.start
      if (dateRange.end) params.endDate = dateRange.end
      
      const response = await apiClient.get<any>('/api/equipment/history', params)
      if (response.success && response.data) {
        setRecords(response.data)
      }
    } catch (error) {
      console.error('FAILED_TO_LOAD_HISTORY:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadScrapList = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: pagination.page,
        pageSize: pagination.pageSize
      }
      if (dateRange.start) params.startDate = dateRange.start
      if (dateRange.end) params.endDate = dateRange.end
      if (filterType !== 'all') params.type = filterType
      
      const response = await apiClient.get<any>('/api/equipment/scrap-list', params)
      if (response.success) {
        setScrapRecords(response.data || [])
        setPagination(prev => ({
          ...prev,
          total: response.total || 0,
          totalPages: response.totalPages || 0
        }))
      }
    } catch (error) {
      console.error('加载报废清单失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionTypeInfo = (type: string) => {
    const config: Record<string, { label: string, color: string, icon: any }> = {
      'inbound': { label: t('equipment.action_type.inbound'), color: 'emerald', icon: Package },
      'transfer': { label: t('equipment.action_type.transfer'), color: 'blue', icon: ArrowRightLeft },
      'repair': { label: t('equipment.action_type.repair'), color: 'amber', icon: Wrench },
      'scrap': { label: t('equipment.action_type.scrap'), color: 'rose', icon: Trash2 },
      'sale': { label: t('equipment.action_type.sale'), color: 'indigo', icon: DollarSign }
    }
    return config[type] || { label: type, color: 'slate', icon: Activity }
  }

  const filteredRecords = records.filter(record => 
    record.equipment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.equipment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (record.operator || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredScrapRecords = scrapRecords.filter(record => 
    record.equipment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.order_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (record.applicant || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const tabs = [
    { id: 'history' as TabType, label: t('equipment.fields.history_ledger'), icon: History },
    { id: 'scrap' as TabType, label: t('equipment.fields.scrap_list'), icon: FileText }
  ]

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8 space-y-8 animate-fade-in custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-700">
            <History className="text-blue-600" size={24} strokeWidth={2.5} />
            {activeTab === 'history' ? t('equipment.fields.history_ledger') : t('equipment.fields.scrap_list')}
          </h1>
          <p className="text-slate-400 font-medium mt-1 text-xs">{t('equipment.history_desc')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-white rounded-lg border border-slate-200 w-full max-w-fit shadow-sm">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id)
              setFilterType('all')
              setSearchTerm('')
              setPagination(prev => ({ ...prev, page: 1 }))
            }}
            className={cn(
              "px-6 py-2 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2",
              activeTab === tab.id ? "bg-slate-900 text-white shadow-md" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
          >
            <tab.icon size={14} strokeWidth={activeTab === tab.id ? 3 : 2} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="premium-card p-4 bg-white/60 backdrop-blur-xl border-none flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex-1 min-w-[300px] relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
          <input
            type="text"
            placeholder={activeTab === 'history' ? t('equipment.placeholders.search_history') : t('equipment.placeholders.search_scrap')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-standard pl-11 !py-2.5 text-sm font-medium bg-white/80 border-slate-100 focus:bg-white !rounded-lg"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-md border border-slate-200">
            <Filter size={14} className="text-slate-400 ml-2" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent text-[10px] font-bold uppercase tracking-wider text-slate-600 outline-none border-none py-1.5 pr-4"
            >
              <option value="all">{t('common.all')}</option>
              {activeTab === 'history' ? (
                <>
                  <option value="inbound">{t('equipment.action_type.inbound')}</option>
                  <option value="transfer">{t('equipment.action_type.transfer')}</option>
                  <option value="repair">{t('equipment.action_type.repair')}</option>
                  <option value="scrap">{t('equipment.action_type.scrap')}</option>
                  <option value="sale">{t('equipment.action_type.sale')}</option>
                </>
              ) : (
                <>
                  <option value="scrap">{t('equipment.action_type.scrap')}</option>
                  <option value="sale">{t('equipment.action_type.sale')}</option>
                </>
              )}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-md border border-slate-200 shadow-sm relative group">
            <Calendar size={14} className="text-slate-400" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="bg-transparent text-[10px] font-bold text-slate-600 outline-none border-none"
            />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest px-2">{t('common.to') || 'TO'}</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="bg-transparent text-[10px] font-bold text-slate-600 outline-none border-none"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pb-20">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4 text-slate-400">
            <Activity className="animate-spin" size={32} />
            <p className="text-[10px] font-bold uppercase tracking-widest">{t('common.loading')}</p>
          </div>
        ) : activeTab === 'history' ? (
          filteredRecords.length === 0 ? (
            <div className="py-20 text-center premium-card bg-white border-none shadow-sm flex flex-col items-center gap-3">
              <div className="p-4 bg-slate-50 rounded-full text-slate-200">
                <AlertCircle size={32} />
              </div>
              <p className="text-xs font-bold text-slate-400">{t('equipment.empty.no_history')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredRecords.map((record) => {
                const info = getActionTypeInfo(record.action_type)
                return (
                  <div
                    key={record.id}
                    className="premium-card p-5 bg-white hover:bg-slate-50 hover:shadow-lg transition-all cursor-pointer group border-none shadow-sm flex items-center justify-between"
                    onClick={() => navigate(`/equipment/${record.equipment_id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shadow-inner transition-all",
                        info.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                        info.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                        info.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                        info.color === 'rose' ? 'bg-rose-50 text-rose-600' :
                        info.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-500'
                      )}>
                        <info.icon size={24} strokeWidth={2.5} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 tracking-tight">{record.equipment_name}</h3>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border",
                            info.color === 'emerald' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            info.color === 'blue' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            info.color === 'amber' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            info.color === 'rose' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                            info.color === 'indigo' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                          )}>
                            {info.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <span className="flex items-center gap-1.5"><Calendar size={12} /> {new Date(record.operated_at).toLocaleString(i18n.language)}</span>
                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                          <span className="flex items-center gap-1.5"><Activity size={12} /> {record.operator}</span>
                        </div>
                        {record.notes && <p className="text-xs text-slate-500 mt-2 italic">"{record.notes}"</p>}
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-300 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                      <ChevronRight size={16} strokeWidth={3} />
                    </div>
                  </div>
                )
              })}
            </div>
          )
        ) : (
          filteredScrapRecords.length === 0 ? (
            <div className="py-20 text-center premium-card bg-white border-none shadow-sm flex flex-col items-center gap-3">
              <div className="p-4 bg-slate-50 rounded-full text-slate-200">
                <FileText size={32} />
              </div>
              <p className="text-xs font-bold text-slate-400">{t('equipment.empty.no_scrap')}</p>
            </div>
          ) : (
            <div className="premium-card overflow-hidden bg-white border-none shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">{t('equipment.fields.order_no')}</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">{t('equipment.fields.name')}</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">{t('equipment.fields.status')}</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-center">{t('equipment.fields.quantity')}</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">{t('equipment.fields.applicant')}</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">{t('equipment.fields.apply_date')}</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">{t('equipment.fields.reason')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredScrapRecords.map((record) => {
                    const info = getActionTypeInfo(record.type)
                    return (
                      <tr key={record.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => navigate(`/equipment/${record.equipment_id}`)}>
                        <td className="px-6 py-4 text-xs font-mono font-bold text-blue-600">{record.order_no}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-900">{record.equipment_name}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border",
                            info.color === 'rose' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                          )}>
                            {info.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">{record.scrap_sale_quantity || 1}</span>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-600">{record.applicant}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-400">
                          {new Date(record.apply_date).toLocaleDateString(i18n.language)}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-500 max-w-[200px] truncate" title={record.reason}>
                          {record.reason}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Improved Pagination */}
        {activeTab === 'scrap' && pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-3">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm"
            >
              <ChevronLeft size={18} strokeWidth={3} />
            </button>
            <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-400 shadow-sm">
              <span className="text-slate-900">{pagination.page}</span> / {pagination.totalPages}
            </div>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(pagination.totalPages, prev.page + 1) }))}
              disabled={pagination.page === pagination.totalPages}
              className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm"
            >
              <ChevronRight size={18} strokeWidth={3} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
