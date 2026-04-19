/**
 * 草稿箱页面 - 现代版
 * Premium High-Density List-Based UI
 */
import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Filter,
  Eye,
  RotateCcw,
  GitBranch,
  Clock,
  FileText,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Activity,
  Layers,
  TrendingUp,
  ShieldCheck,
  History,
  Tag,
  ArrowUpRight,
  Plus,
  XCircle
} from 'lucide-react'
import { API_URL, parseJWTToken } from '../../config/api'
import { apiClient } from '../../utils/apiClient'
import { useMessage } from '../../hooks/useMessage'
import { useConfirm } from '../../hooks/useConfirm'
import { cn } from '../../utils/cn'
import { useTranslation } from 'react-i18next'

interface DraftOrder {
  id: string
  order_no: string
  order_type: string
  title: string
  status: string
  current_node: string
  form_data: Record<string, any>
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
        color === 'blue' ? 'bg-blue-50 text-blue-600' :
        color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
        color === 'amber' ? 'bg-amber-50 text-amber-600' :
        color === 'rose' ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'
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

export default function ApprovalDraftPage() {
  const navigate = useNavigate()
  const { success, error: showError } = useMessage()
  const { confirm } = useConfirm()
  const { t, i18n } = useTranslation()

  const ORDER_TYPE_LABELS = useMemo(() => ({
    'person_onboard': { label: t('order_types.person_onboard'), color: 'blue', icon: User },
    'personnel_onboard': { label: t('order_types.personnel_onboard'), color: 'blue', icon: User },
    'personnel_offboard': { label: t('order_types.personnel_offboard'), color: 'rose', icon: User },
    'personnel_transfer': { label: t('order_types.personnel_transfer'), color: 'indigo', icon: History },
    'personnel_leave': { label: t('order_types.personnel_leave'), color: 'amber', icon: Calendar },
    'personnel_trip': { label: t('order_types.personnel_trip'), color: 'cyan', icon: Calendar },
    'equipment_inbound': { label: t('order_types.equipment_inbound'), color: 'emerald', icon: FileText },
    'equipment_outbound': { label: t('order_types.equipment_outbound'), color: 'orange', icon: FileText },
    'equipment_transfer': { label: t('order_types.equipment_transfer'), color: 'violet', icon: History },
    'equipment_repair': { label: t('order_types.equipment_repair'), color: 'pink', icon: Activity },
    'equipment_scrap': { label: t('order_types.equipment_scrap'), color: 'slate', icon: FileText },
    'project_completion': { label: t('order_types.project_completion'), color: 'indigo', icon: ShieldCheck },
    'purchase_request': { label: t('order_types.purchase_request'), color: 'teal', icon: TrendingUp }
  }), [t])

  const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; border: string; icon: any }> = useMemo(() => ({
    'draft': { label: t('approval_draft.draft'), color: 'text-slate-500', bgColor: 'bg-slate-50', border: 'border-slate-100', icon: FileText },
    'rejected': { label: t('approval_draft.rejected_status'), color: 'text-rose-600', bgColor: 'bg-rose-50', border: 'border-rose-100', icon: History },
    'withdrawn': { label: t('approval_draft.withdrawn_status'), color: 'text-amber-600', bgColor: 'bg-amber-50', border: 'border-amber-100', icon: RotateCcw }
  }), [t])

  const [orders, setOrders] = useState<DraftOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'rejected' | 'withdrawn'>('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)

  useEffect(() => { loadOrders() }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const result = await apiClient.get<any>(`${API_URL.BASE}/api/draft/list`, { params: { pageSize: 100 } })
      if (result) {
        const drafts = Array.isArray(result.data?.drafts || result.drafts) ? (result.data?.drafts || result.drafts) : []
        setOrders(drafts.map((draft: any) => ({
          id: draft.id,
          order_no: draft.id?.substring(0, 8).toUpperCase() || 'DRAFT',
          order_type: draft.templateKey || draft.template_key,
          title: draft.metadata?.definitionName || draft.metadata?.title || t('approval_draft.no_name'),
          status: draft.status || 'draft',
          current_node: t('approval_draft.draft_archived'),
          form_data: draft.formData || draft.form_data,
          created_at: draft.createdAt || draft.created_at,
          updated_at: draft.updatedAt || draft.updated_at
        })))
      }
    } catch (e: any) { showError(e.message || t('approval_draft.load_failed')) } finally { setLoading(false) }
  }

  const filteredOrders = useMemo(() => orders.filter(order => {
    if (filterStatus !== 'all' && order.status !== filterStatus) return false
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase()
      if (!order.title.toLowerCase().includes(kw) && !order.order_no.toLowerCase().includes(kw)) return false
    }
    return true
  }), [orders, filterStatus, searchKeyword])

  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const totalPages = Math.ceil(filteredOrders.length / pageSize)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(i18n.resolvedLanguage || i18n.language || 'zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    })
  }

  const handleDelete = async (order: DraftOrder) => {
    if (!(await confirm({ title: t('approval_draft.confirm_delete'), content: t('approval_draft.delete_confirm'), type: 'danger' }))) return
    try {
      await apiClient.delete(`${API_URL.BASE}/api/draft/${order.id}`)
      success(t('approval_draft.draft_deleted'))
      loadOrders()
    } catch (e: any) { showError(e.message || t('common.error')) }
  }

  const stats = useMemo(() => ({
    total: orders.length,
    rejected: orders.filter(o => o.status === 'rejected').length,
    withdrawn: orders.filter(o => o.status === 'withdrawn').length,
    occupancy: "12%"
  }), [orders])

  return (
    <div className="min-h-screen bg-mesh p-4 lg:p-6 space-y-4 animate-fade-in custom-scrollbar">
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-2xl font-bold text-slate-700 flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg text-white shadow-brand">
              <History size={20} strokeWidth={2.5} />
            </div>
            {t('approval_draft.title')}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('approval_draft.subtitle')}</p>
        </motion.div>

        <button
          onClick={() => loadOrders()}
          className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-200 transition-all shadow-sm"
        >
          <RotateCcw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title={t('approval_draft.total')} value={stats.total} icon={Layers} color="blue" delay={0.1} />
        <StatCard title={t('approval_draft.rejected')} value={stats.rejected} icon={XCircle} color="rose" delay={0.2} />
        <StatCard title={t('approval_draft.withdrawn')} value={stats.withdrawn} icon={RotateCcw} color="amber" delay={0.3} />
        <StatCard title={t('approval_draft.occupancy')} value={stats.occupancy} icon={Database} color="indigo" delay={0.4} />
      </div>

      {/* Intelligence Filter Bar */}
      <div className="premium-card p-4 bg-white/60 backdrop-blur-xl border-none flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex bg-slate-100/50 p-1 rounded-lg gap-1">
          {['all', 'draft', 'rejected', 'withdrawn'].map((f) => (
            <button
              key={f}
              onClick={() => { setFilterStatus(f as any); setCurrentPage(1) }}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                filterStatus === f ? "bg-white text-amber-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {f === 'all' ? t('approval_draft.all') : f === 'draft' ? t('approval_draft.draft') : f === 'rejected' ? t('approval_draft.rejected_status') : t('approval_draft.withdrawn_status')}
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-[200px] relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={14} />
          <input
            type="text"
            placeholder={t('approval_draft.search_placeholder')}
            value={searchKeyword}
            onChange={(e) => { setSearchKeyword(e.target.value); setCurrentPage(1) }}
            className="input-standard pl-9 !py-2 text-sm bg-white/50 border-white focus:bg-white !rounded-lg w-full"
          />
        </div>
      </div>

      {/* Premium Rows List */}
      <div className="space-y-2 pb-16">
        <div className="grid grid-cols-12 gap-3 px-4 py-2 text-xs font-medium text-slate-400">
          <div className="col-span-1">{t('approval_draft.number')}</div>
          <div className="col-span-4">{t('approval_draft.draft_name')}</div>
          <div className="col-span-2">{t('approval_draft.update_time')}</div>
          <div className="col-span-2">{t('approval_draft.status')}</div>
          <div className="col-span-2 text-center">{t('approval_draft.type')}</div>
          <div className="col-span-1"></div>
        </div>

        <AnimatePresence mode="popLayout">
          {loading ? (
             Array.from({length: 6}).map((_, i) => (
                <div key={i} className="premium-card h-20 bg-white/40 animate-pulse border-none" />
             ))
          ) : paginatedOrders.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center space-y-4 bg-white/30 rounded-2xl border border-dashed border-slate-200">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <ShieldCheck size={32} />
              </div>
              <p className="text-slate-400 text-sm">{t('approval_draft.no_drafts')}</p>
            </motion.div>
          ) : (
            paginatedOrders.map((order, idx) => {
              const typeConfig = ORDER_TYPE_LABELS[order.order_type as keyof typeof ORDER_TYPE_LABELS] || { label: order.order_type, color: 'slate', icon: FileText }
              const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG['draft']
              const TypeIcon = typeConfig.icon
              const StatusIcon = statusConfig.icon
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  onClick={() => navigate(`/approvals/form/${order.order_type}?draftId=${order.id}`)}
                  className="grid grid-cols-12 gap-3 px-4 py-3 items-center premium-card border-none bg-white hover:bg-slate-50 hover:shadow-md cursor-pointer transition-all group"
                >
                  <div className="col-span-1">
                     <span className="text-xs font-mono text-slate-400 group-hover:text-amber-600 transition-colors">
                        {order.order_no}
                     </span>
                  </div>

                  <div className="col-span-4 flex items-center gap-3">
                     <div className={cn(
                       "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white",
                       typeConfig.color === 'blue' && 'bg-blue-600',
                       typeConfig.color === 'emerald' && 'bg-emerald-600',
                       typeConfig.color === 'amber' && 'bg-amber-600',
                       typeConfig.color === 'indigo' && 'bg-indigo-600',
                       typeConfig.color === 'rose' && 'bg-rose-600',
                       typeConfig.color === 'violet' && 'bg-violet-600',
                       typeConfig.color === 'cyan' && 'bg-cyan-600',
                       typeConfig.color === 'teal' && 'bg-teal-600',
                       typeConfig.color === 'slate' && 'bg-slate-700'
                     )}>
                        <TypeIcon size={14} strokeWidth={2} />
                     </div>
                     <div className="min-w-0">
                        <h4 className="text-sm font-medium text-slate-700 leading-none mb-1 group-hover:text-amber-600 truncate">{order.title}</h4>
                        <p className="text-xs text-slate-400">{typeConfig.label}</p>
                     </div>
                  </div>

                  <div className="col-span-2 text-xs text-slate-500">
                     {formatDate(order.updated_at)}
                  </div>

                  <div className="col-span-2">
                     <div className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", statusConfig.bgColor, statusConfig.color)}>
                        <StatusIcon size={12} strokeWidth={2} />
                        {statusConfig.label}
                     </div>
                  </div>

                  <div className="col-span-2 text-center">
                     <span className="text-xs text-slate-500">{order.current_node}</span>
                  </div>

                  <div className="col-span-1 text-right flex items-center justify-end gap-1">
                     <div className="opacity-0 group-hover:opacity-100 transition-all flex gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(order); }}
                          className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        >
                           <Trash2 size={14} strokeWidth={2} />
                        </button>
                        <div className="w-8 h-8 flex items-center justify-center text-white bg-slate-800 rounded-lg group-hover:bg-amber-500 transition-all">
                           <ArrowUpRight size={14} strokeWidth={2} />
                        </div>
                     </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>

        {/* Improved Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-white/40 backdrop-blur-md rounded-xl border border-white mt-3">
            <div className="text-xs text-slate-500">
              {t('approval_draft.records_count', { count: filteredOrders.length, current: currentPage, total: totalPages })}
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={(e) => { e.stopPropagation(); setCurrentPage(p => p - 1); }}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 text-xs font-medium border",
                  currentPage === 1 ? "bg-slate-50 border-slate-100 text-slate-300 pointer-events-none" : "bg-white border-slate-200 text-slate-600 hover:border-amber-400 hover:text-amber-600"
                )}
              >
                <ChevronLeft size={14} />
                {t('approval_draft.prev_page')}
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={(e) => { e.stopPropagation(); setCurrentPage(p => p + 1); }}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 text-xs font-medium border",
                  currentPage === totalPages ? "bg-slate-50 border-slate-100 text-slate-300 pointer-events-none" : "bg-white border-slate-200 text-slate-600 hover:border-amber-400 hover:text-amber-600"
                )}
              >
                {t('approval_draft.next_page')}
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const Database = ({ className, size }: { className?: string; size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5V19A9 3 0 0 0 21 19V5" />
    <path d="M3 12A9 3 0 0 0 21 12" />
  </svg>
)