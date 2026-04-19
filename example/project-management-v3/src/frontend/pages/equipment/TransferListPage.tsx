import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  ArrowRightLeft, 
  Search, 
  Filter, 
  Plus, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  MapPin,
  Calendar,
  AlertCircle,
  FileText,
  Activity,
  Truck,
  Package,
  ChevronLeft
} from 'lucide-react'
import { apiClient } from '../../utils/apiClient'
import { useMessage } from '../../hooks/useMessage'
import { cn } from '../../utils/cn'

interface TransferOrder {
  id: string
  order_no: string
  from_location_type: 'warehouse' | 'project'
  from_location_id: string
  from_location_name: string
  to_location_type: 'warehouse' | 'project'
  to_location_id: string
  to_location_name: string
  from_manager_id: string
  from_manager_name: string
  to_manager_id: string
  to_manager_name: string
  transfer_reason: string
  expected_arrival_date: string
  status: 'pending' | 'approved' | 'receiving' | 'completed' | 'cancelled'
  created_at: string
  items: any[]
}

export default function TransferListPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { error: showError } = useMessage()
  const [transfers, setTransfers] = useState<TransferOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const statusColors: Record<string, string> = {
    'pending': 'text-amber-600 bg-amber-50 border-amber-100',
    'approved': 'text-emerald-600 bg-emerald-50 border-emerald-100',
    'receiving': 'text-blue-600 bg-blue-50 border-blue-100',
    'completed': 'text-slate-500 bg-slate-50 border-slate-200',
    'cancelled': 'text-rose-600 bg-rose-50 border-rose-100',
  };

  useEffect(() => {
    loadTransfers()
  }, [page, searchTerm, statusFilter])

  const loadTransfers = async () => {
    try {
      setLoading(true)
      const params: any = {
        page,
        pageSize: 10
      }
      if (searchTerm) params.search = searchTerm
      if (statusFilter) params.status = statusFilter

      const result = await apiClient.get<any>('/api/equipment/transfers', params)

      if (result && result.success) {
        setTransfers(result.data || [])
        setTotalPages(Math.ceil((result.total || 0) / (result.pageSize || 10)) || 1)
      }
    } catch (error: any) {
      showError(error.message || t('personnel.error.load_failed'))
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const config: any = {
      'pending': { label: t('equipment.transfer_status.pending'), color: 'amber', icon: Clock },
      'approved': { label: t('workflow.status.approved'), color: 'emerald', icon: CheckCircle2 },
      'receiving': { label: t('equipment.transfer_status.receiving'), color: 'blue', icon: Package },
      'completed': { label: t('equipment.transfer_status.completed'), color: 'slate', icon: CheckCircle2 },
      'cancelled': { label: t('equipment.transfer_status.cancelled'), color: 'rose', icon: AlertCircle },
    }
    const current = config[status] || { label: status, color: 'slate', icon: FileText }
    const Icon = current.icon

    return (
      <div className={cn(
        "px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 border",
        statusColors[status] || "bg-slate-50 text-slate-500 border-slate-100"
      )}>
        <Icon size={12} />
        {current.label}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8 space-y-8 animate-fade-in custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-700">
            <ArrowRightLeft className="text-blue-600" size={24} strokeWidth={2.5} />
            {t('equipment.transfer_mgmt')}
          </h1>
          <p className="text-slate-400 font-medium mt-1 text-xs">{t('wbs.subtitle')}</p>
        </div>

        <button 
          onClick={() => navigate('/approvals/new')}
          className="px-6 py-2 bg-blue-600 text-white rounded-md shadow-md transition-all font-bold text-xs flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={18} />
          <span>{t('workflow.action.initiate')}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="premium-card p-4 bg-white/60 backdrop-blur-xl border-none flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex-1 min-w-[300px] relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
          <input
            type="text"
            placeholder={t('common.search_placeholder')}
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
            className="input-standard pl-11 !py-2.5 text-sm font-medium bg-white/80 border-slate-100 focus:bg-white !rounded-lg"
          />
        </div>

        <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
          {[
            { id: '', label: t('common.all') },
            { id: 'pending', label: t('workflow.status.pending') },
            { id: 'approved', label: t('workflow.status.approved') },
            { id: 'receiving', label: t('equipment.transfer_status.receiving') },
            { id: 'completed', label: t('equipment.transfer_status.completed') }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => { setStatusFilter(f.id); setPage(1); }}
              className={cn(
                "px-4 py-1.5 rounded-md text-[10px] font-bold transition-all",
                statusFilter === f.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 pb-20">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4 text-slate-400">
            <Activity className="animate-spin" size={32} />
            <p className="text-[10px] font-bold uppercase tracking-widest">{t('common.loading')}</p>
          </div>
        ) : transfers.length === 0 ? (
          <div className="py-20 text-center premium-card bg-white border-none shadow-sm flex flex-col items-center gap-3">
            <div className="p-4 bg-slate-50 rounded-full text-slate-200">
              <ArrowRightLeft size={32} />
            </div>
            <p className="text-xs font-bold text-slate-400">{t('equipment.empty.no_archive')}</p>
          </div>
        ) : (
          transfers.map((transfer) => (
            <div
              key={transfer.id}
              className="premium-card p-5 bg-white hover:bg-slate-50 hover:shadow-lg transition-all cursor-pointer group border-none shadow-sm relative overflow-hidden"
              onClick={() => navigate(`/equipment/transfers/${transfer.id}`)}
            >
              <div className="flex justify-between items-start relative z-10">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-mono font-bold rounded">
                      {transfer.order_no}
                    </div>
                    {getStatusBadge(transfer.status)}
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                       <MapPin size={14} className="text-blue-500" />
                       <span className="text-sm font-bold text-slate-900">{transfer.from_location_name}</span>
                    </div>
                    <ArrowRight className="text-slate-300" size={14} strokeWidth={2.5} />
                    <div className="flex items-center gap-2">
                       <MapPin size={14} className="text-emerald-500" />
                       <span className="text-sm font-bold text-slate-900">{transfer.to_location_name}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[10px] font-medium text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Package size={12} />
                      {t('equipment.fields.quantity')}: {transfer.items?.length || 0}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar size={12} />
                      {t('workflow.fields.created_at')}: {new Date(transfer.created_at).toLocaleDateString(i18n.language)}
                    </span>
                    <span className="flex items-center gap-1.5 truncate max-w-[300px]">
                      <FileText size={12} />
                      {t('equipment.fields.reason')}: {transfer.transfer_reason || '-'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                    <ChevronRight size={14} strokeWidth={3} />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-3">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm"
            >
              <ChevronLeft size={18} strokeWidth={3} />
            </button>
            <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-400 shadow-sm">
              <span className="text-slate-900">{page}</span> / {totalPages}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
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