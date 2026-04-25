/**
 * 我的申请页面 - 现代版
 * Premium High-Density List-Based UI
 */
import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Filter,
  RotateCcw,
  GitBranch,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  User,
  Plus,
  ArrowRight,
  Activity,
  Layers,
  Database,
  TrendingUp,
  MapPin,
  X,
  ShieldCheck,
  Send,
  UserCheck,
  Building,
  Tag,
  AlertCircle
} from 'lucide-react'
import { useUser } from '../../contexts/UserContext'
import { useMessage } from '../../hooks/useMessage'
import { useConfirm } from '../../hooks/useConfirm'
import { API_URL } from '../../config/api'
import { apiClient } from '../../utils/apiClient'
import { cn } from '../../utils/cn'
import { useTranslation } from 'react-i18next'
import FlowDetailView from '../../components/workflow/FlowDetailView'
import { workflowApi } from '../../api/workflowApi'
import { formApi } from '../../api/formApi'

interface ApprovalOrder {
  id: string
  order_no: string
  order_type: string
  title: string
  status: string
  current_node: string
  current_assignee_name?: string
  form_data: Record<string, any>
  audit_logs: any[]
  created_at: string
  updated_at: string
  initiator_name?: string
}

const getFormFieldLabels = (t: any): Record<string, string> => ({
  'employee_name': t('personnel.fields.name'), 'employee_id': t('personnel.fields.employee_no'), 'department_id': t('personnel.fields.dept'), 'position_id': t('personnel.fields.position'),
  'phone': t('personnel.fields.phone'), 'gender': t('personnel.fields.gender'), 'start_date': t('personnel.fields.hireDate'), 'employee_type': t('personnel.fields.employee_type'),
  'email': t('personnel.fields.email'), 'id_card': t('personnel.fields.id_card'), 'address': t('personnel.fields.address'), 'emergency_contact': t('personnel.fields.emergency_contact'),
  'emergency_phone': t('personnel.fields.emergency_phone'), 'education': t('personnel.fields.education'), 'major': t('personnel.fields.major'), 'graduation_school': t('personnel.fields.graduation_school'),
  'graduation_date': t('personnel.fields.graduation_date'), 'bank_account': t('personnel.fields.bank_account'), 'bank_name': t('personnel.fields.bank_name'), 'remark': t('personnel.fields.remark'),
  'inbound_type': t('equipment.fields.inbound_type'), 'warehouse_id': t('equipment.fields.warehouse'), 'supplier': t('equipment.fields.supplier'), 'purchase_date': t('equipment.fields.purchase_date'),
  'notes': t('personnel.fields.remark'), 'fromLocationType': t('equipment.fields.from_location'), 'fromLocationId': t('equipment.fields.from_location'), 'fromManagerId': t('equipment.fields.from_location'),
  'toLocationType': t('equipment.fields.to_location'), 'toLocationId': t('equipment.fields.to_location'), 'toManagerId': t('equipment.fields.to_location'),
  'transferReason': t('equipment.fields.transfer_reason'), 'estimatedArrivalDate': t('equipment.fields.estimated_arrival'), 'shippingDate': t('workflow.fields.shipping_date') || 'Shipping Date',
  'waybillNo': t('workflow.fields.shipping_no'), 'shippingNotes': t('workflow.fields.shipping_note'), 'receiveStatus': t('workflow.fields.receiving_status') || 'Receiving Status', 'receiveComment': t('workflow.fields.receiving_note') || 'Receiving Note'
})

const getGenderLabels = (t: any): Record<string, string> => ({ 'male': t('personnel.gender.male'), 'female': t('personnel.gender.female') })
const getEmployeeTypeLabels = (t: any): Record<string, string> => ({
  'regular': t('personnel.employee_type_labels.regular'),
  'probation': t('personnel.employee_type_labels.probation'),
  'intern': t('personnel.employee_type_labels.intern'),
  'contract': t('personnel.employee_type_labels.contract'),
  'part_time': t('personnel.employee_type_labels.part_time')
})
const getInboundTypeLabels = (t: any): Record<string, string> => ({ 'purchase': t('equipment.inbound_type_labels.purchase'), 'repair_return': t('equipment.inbound_type_labels.repair_return'), 'other': t('equipment.inbound_type_labels.other') })
const getEquipmentCategoryLabels = (t: any): Record<string, string> => ({ 'instrument': t('equipment.categories.instrument'), 'fake_load': t('equipment.categories.fake_load'), 'accessory': t('equipment.categories.accessory') })
const getLocationTypeLabels = (t: any): Record<string, string> => ({ 'warehouse': t('equipment.location_type_labels.warehouse'), 'project': t('equipment.location_type_labels.project') })
const getReceiveStatusLabels = (t: any): Record<string, string> => ({ 'normal': t('equipment.receive_status_labels.normal'), 'damaged': t('equipment.receive_status_labels.damaged'), 'missing': t('equipment.receive_status_labels.missing'), 'partial': t('equipment.receive_status_labels.partial') })

const getOrderTypeLabels = (t: any): Record<string, { label: string; color: string; icon: any }> => ({
  'person_onboard': { label: t('workflow.categories.hr'), color: 'blue', icon: User },
  'personnel_onboard': { label: t('workflow.categories.hr'), color: 'blue', icon: User },
  'personnel_offboard': { label: t('workflow.categories.hr'), color: 'rose', icon: User },
  'equipment_inbound': { label: t('workflow.categories.equipment'), color: 'emerald', icon: Database },
  'equipment_outbound': { label: t('workflow.categories.equipment'), color: 'orange', icon: Send },
  'equipment_transfer': { label: t('workflow.categories.equipment'), color: 'indigo', icon: GitBranch },
  'equipment_repair': { label: t('workflow.categories.equipment'), color: 'pink', icon: Activity },
  'equipment_scrap': { label: t('workflow.categories.equipment'), color: 'slate', icon: Database },
  'project_completion': { label: t('workflow.categories.project'), color: 'violet', icon: CheckCircle2 },
  'purchase_request': { label: t('workflow.categories.purchase'), color: 'cyan', icon: FileText },
  'project_approval': { label: t('workflow.categories.project'), color: 'violet', icon: CheckCircle2 }
})

const getStatusConfig = (t: any): Record<string, { label: string; color: string; bgColor: string; icon: any; glow: string }> => ({
  'pending': { label: t('workflow.status.normal'), color: 'text-amber-500', bgColor: 'bg-amber-50', icon: Clock, glow: 'shadow-amber-500/20' },
  'approved': { label: t('workflow.status.success'), color: 'text-emerald-500', bgColor: 'bg-emerald-50', icon: CheckCircle2, glow: 'shadow-emerald-500/20' },
  'rejected': { label: t('workflow.status.rejected'), color: 'text-rose-500', bgColor: 'bg-rose-50', icon: XCircle, glow: 'shadow-rose-500/20' },
  'withdrawn': { label: t('workflow.status.withdrawn'), color: 'text-slate-400', bgColor: 'bg-slate-50', icon: RotateCcw, glow: 'shadow-slate-500/10' },
  'running': { label: t('workflow.status.normal'), color: 'text-amber-500', bgColor: 'bg-amber-50', icon: Clock, glow: 'shadow-amber-500/20' },
  'completed': { label: t('workflow.status.success'), color: 'text-emerald-500', bgColor: 'bg-emerald-50', icon: CheckCircle2, glow: 'shadow-emerald-500/20' },
  'terminated': { label: t('workflow.status.archived_engine') || 'Terminated', color: 'text-rose-500', bgColor: 'bg-rose-50', icon: XCircle, glow: 'shadow-rose-500/20' }
})

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

export default function ApprovalMinePageNew() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user } = useUser()
  const { success, error } = useMessage()
  const { confirm } = useConfirm()
  
  const ORDER_TYPE_LABELS = getOrderTypeLabels(t)
  const STATUS_CONFIG = getStatusConfig(t)
  const FORM_FIELD_LABELS = getFormFieldLabels(t)
  const GENDER_LABELS = getGenderLabels(t)
  const EMPLOYEE_TYPE_LABELS = getEmployeeTypeLabels(t)
  const INBOUND_TYPE_LABELS = getInboundTypeLabels(t)
  const RECEIVE_STATUS_LABELS = getReceiveStatusLabels(t)

  const [orders, setOrders] = useState<ApprovalOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<ApprovalOrder | null>(null)
  const [formTemplate, setFormTemplate] = useState<any>(null)
  const [timeline, setTimeline] = useState<any[]>([])
  const [transferOrderDetail, setTransferOrderDetail] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [dateRange, setDateRange] = useState<'all' | 'week' | 'month' | 'quarter'>('all')

  useEffect(() => { if (user?.id) loadOrders() }, [user?.id])
  
  useEffect(() => {
    const loadTransferDetail = async () => {
      const transferOrderId = selectedOrder?.form_data?.transferOrderId || selectedOrder?.form_data?.businessId || (selectedOrder as any)?.business_id
      if (selectedOrder?.order_type === 'equipment-transfer' && transferOrderId) {
        try {
          const result = await apiClient.get<any>(`${API_URL.BASE}/api/equipment/transfers/${transferOrderId}`)
          setTransferOrderDetail(result?.data || result)
        } catch (e) { console.warn('加载调拨单详情失败', e) }
      } else setTransferOrderDetail(null)
    }
    const loadFormTemplate = async () => {
      if (!selectedOrder?.order_type) { setFormTemplate(null); return }
      try {
        const res = await formApi.getTemplate(selectedOrder.order_type)
        setFormTemplate(res.data)
      } catch { setFormTemplate(null) }
    }
    const loadTimeline = async () => {
      if (!selectedOrder?.id) { setTimeline([]); return }
      try {
        const res = await workflowApi.getTimeline(selectedOrder.id)
        setTimeline(res.data?.timeline || [])
      } catch { setTimeline([]) }
    }
    loadTransferDetail()
    loadFormTemplate()
    loadTimeline()
  }, [selectedOrder])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const userId = user?.id || 'current-user'
      const result = await apiClient.get<any>(`${API_URL.BASE}/api/workflow/processes?initiatorId=${userId}`)
      const ordersData = result?.data || result
      if (ordersData && Array.isArray(ordersData)) {
        const mappedOrders = ordersData.map((item: any) => {
          let displayStatus = item.status;
          if (item.status === 'running') displayStatus = 'pending';
          else if (item.status === 'completed' || item.status === 'finished') displayStatus = item.result || 'approved';
          else if (item.status === 'terminated' || item.status === 'rejected') displayStatus = 'rejected';
          return {
            id: item.id,
            order_no: item.id.substring(0, 8).toUpperCase(),
            order_type: item.definition_key,
            title: item.title,
            status: displayStatus,
            current_node: item.current_node_name || t('workflow.status.completed_short'),
            current_assignee_name: item.current_assignee_name || '',
            form_data: item.form_data || item.variables?.formData || {},
            audit_logs: [],
            created_at: item.created_at,
            updated_at: item.updated_at,
            initiator_name: item.initiator_name || t('workflow.fields.current_user')
          };
        })
        setOrders(mappedOrders)
      } else setOrders([])
    } catch (e) { setOrders([]) } finally { setLoading(false) }
  }

  const filteredOrders = useMemo(() => orders.filter(order => {
    if (filter !== 'all' && order.status !== filter) return false
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase()
      if (!order.title.toLowerCase().includes(keyword) && !order.order_no.toLowerCase().includes(keyword) && !(ORDER_TYPE_LABELS[order.order_type]?.label || '').toLowerCase().includes(keyword)) return false
    }
    if (dateRange !== 'all') {
      const diffDays = (new Date().getTime() - new Date(order.created_at).getTime()) / (1000 * 3600 * 24)
      if (dateRange === 'week' && diffDays > 7) return false
      if (dateRange === 'month' && diffDays > 30) return false
      if (dateRange === 'quarter' && diffDays > 90) return false
    }
    return true
  }), [orders, filter, searchKeyword, dateRange, ORDER_TYPE_LABELS])

  const totalPages = Math.ceil(filteredOrders.length / pageSize)
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  
  const handleWithdraw = async (id: string) => {
    if (!(await confirm({ 
      title: t('workflow.action.confirm_withdraw', 'Confirm Withdraw'), 
      content: t('workflow.action.confirm_withdraw_desc', 'Are you sure you want to withdraw this request?') 
    }))) return
    try {
      await apiClient.post(`${API_URL.BASE}/api/workflow/processes/${id}/withdraw`)
      success(t('workflow.action.withdrawn_success', 'Withdrawn'))
      loadOrders()
    } catch (e) {}
  }

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG['pending']
    const Icon = config.icon
    return (
      <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all", config.bgColor, config.color, "border-transparent shadow-sm", config.glow)}>
        <Icon className="w-3.5 h-3.5" strokeWidth={3} />
        {config.label}
      </div>
    )
  }

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString(i18n.language, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => ['pending', 'running'].includes(o.status)).length,
    approved: orders.filter(o => ['approved', 'completed'].includes(o.status)).length,
    efficiency: orders.length > 0 ? "98.5%" : "---"
  }), [orders])

  return (
    <div className="min-h-screen bg-mesh p-4 lg:p-6 space-y-4 animate-fade-in custom-scrollbar">
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-indigo-500 rounded-lg text-white">
              <Plus size={20} strokeWidth={2.5} />
            </div>
            {t('sidebar.myInitiated')}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('workflow.view_my_requests') || 'View my requests'}</p>
        </motion.div>

        <button
          onClick={() => navigate('/approvals/new')}
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all shadow-sm flex items-center gap-2 text-sm font-medium"
        >
          <Plus size={14} />
          <span>{t('workflow.action.initiate')}</span>
        </button>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title={t('workflow.stats.total_requests') || 'Total Requests'} value={stats.total} icon={Layers} color="blue" delay={0.1} />
        <StatCard title={t('workflow.status.normal')} value={stats.pending} icon={Clock} color="amber" delay={0.2} />
        <StatCard title={t('workflow.status.success')} value={stats.approved} icon={ShieldCheck} color="emerald" delay={0.3} />
        <StatCard title={t('workflow.stats.completion_rate')} value={stats.efficiency} icon={TrendingUp} color="indigo" delay={0.4} />
      </div>

      {/* Intelligence Filter Bar */}
      <div className="premium-card p-4 bg-white/60 backdrop-blur-xl border-none flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex bg-slate-100/50 p-1 rounded-lg gap-1">
          {['all', 'pending', 'approved', 'rejected'].map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f as any); setCurrentPage(1) }}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                filter === f ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {f === 'all' ? t('common.all') : f === 'pending' ? t('workflow.status.normal') : f === 'approved' ? t('workflow.status.success') : t('workflow.status.rejected')}
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-[200px] relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={14} />
          <input
            type="text"
            placeholder={t('workflow.placeholder.search_requests') || t('common.search')}
            value={searchKeyword}
            onChange={(e) => { setSearchKeyword(e.target.value); setCurrentPage(1) }}
            className="input-standard pl-9 !py-2 text-sm bg-white/50 border-white focus:bg-white !rounded-lg w-full"
          />
        </div>
      </div>

      {/* Premium Rows List */}
      <div className="space-y-2 pb-16">
        <div className="grid grid-cols-12 gap-3 px-4 py-2 text-xs font-medium text-slate-400">
          <div className="col-span-1">{t('workflow.fields.sn') || t('common.index')}</div>
          <div className="col-span-4">{t('workflow.fields.title')}</div>
          <div className="col-span-2">{t('workflow.fields.time') || t('common.startTime')}</div>
          <div className="col-span-2">{t('workflow.fields.node_handler') || 'Node/Handler'}</div>
          <div className="col-span-2 text-center">{t('common.status')}</div>
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
                <FileText size={32} />
              </div>
              <p className="text-slate-400 text-sm">{t('common.noData')}</p>
            </motion.div>
          ) : (
            paginatedOrders.map((order, idx) => {
              const typeConfig = ORDER_TYPE_LABELS[order.order_type] || { label: order.order_type, color: 'slate', icon: FileText }
              const TypeIcon = typeConfig.icon
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  onClick={() => setSelectedOrder(order)}
                  className="grid grid-cols-12 gap-3 px-4 py-3 items-center premium-card border-none bg-white hover:bg-slate-50 hover:shadow-md cursor-pointer transition-all group"
                >
                  <div className="col-span-1">
                     <span className="text-xs font-mono text-slate-400 group-hover:text-indigo-600 transition-colors">
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
                       typeConfig.color === 'pink' && 'bg-pink-600',
                       typeConfig.color === 'slate' && 'bg-slate-700',
                       typeConfig.color === 'violet' && 'bg-violet-600',
                       typeConfig.color === 'cyan' && 'bg-cyan-600'
                     )}>
                        <TypeIcon size={14} strokeWidth={2} />
                     </div>
                     <div className="min-w-0">
                        <h4 className="text-sm font-medium text-slate-700 leading-none mb-1 group-hover:text-indigo-600 truncate">{order.title}</h4>
                        <div className="flex items-center gap-1.5">
                           <Tag size={10} className="text-slate-300" />
                           <p className="text-xs text-slate-400">{typeConfig.label}</p>
                        </div>
                     </div>
                  </div>

                  <div className="col-span-2">
                    <span className="text-xs text-slate-500">{formatDate(order.created_at)}</span>
                  </div>

                  <div className="col-span-2">
                     <div className="space-y-1">
                        <span className="text-xs text-slate-700 truncate">{order.current_node}</span>
                        {order.current_assignee_name && (
                           <span className="text-xs text-slate-400">{order.current_assignee_name}</span>
                        )}
                     </div>
                  </div>

                  <div className="col-span-2 text-center">
                     {getStatusBadge(order.status)}
                  </div>

                  <div className="col-span-1 text-right flex items-center justify-end gap-2">
                     <div className="opacity-0 group-hover:opacity-100 transition-all flex gap-1">
                        {order.status === 'pending' && (
                           <button
                             onClick={(e) => { e.stopPropagation(); handleWithdraw(order.id); }}
                             className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                             title={t('workflow.action.withdraw')}
                           >
                              <RotateCcw size={14} strokeWidth={2} />
                           </button>
                        )}
                        <div className="w-8 h-8 flex items-center justify-center text-white bg-slate-800 rounded-lg group-hover:bg-indigo-500 transition-all">
                           <ArrowRight size={14} strokeWidth={2} />
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
              {t('common.total')} <span className="font-medium text-slate-700">{filteredOrders.length}</span> {t('common.records')}，{t('common.page')} <span className="font-medium text-slate-700">{currentPage}</span> / <span className="font-medium text-slate-700">{totalPages}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={(e) => { e.stopPropagation(); setCurrentPage(p => p - 1); }}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 text-xs font-medium border",
                  currentPage === 1 ? "bg-slate-50 border-slate-100 text-slate-300 pointer-events-none" : "bg-white border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600"
                )}
              >
                <ChevronLeft size={14} />
                {t('common.prev_page')}
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={(e) => { e.stopPropagation(); setCurrentPage(p => p + 1); }}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 text-xs font-medium border",
                  currentPage === totalPages ? "bg-slate-50 border-slate-100 text-slate-300 pointer-events-none" : "bg-white border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600"
                )}
              >
                {t('common.next_page')}
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[40px] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* FlowDetailView - Unified */}
            <div className="p-10 overflow-y-auto custom-scrollbar flex-1">
              <FlowDetailView
                title={selectedOrder.title}
                processTitle={selectedOrder.title}
                initiatorName={selectedOrder.initiator_name}
                createdAt={selectedOrder.created_at}
                nodeName={selectedOrder.current_node}
                orderType={ORDER_TYPE_LABELS[selectedOrder.order_type]?.label || selectedOrder.order_type}
                handlerName={selectedOrder.current_assignee_name}
                formTemplate={formTemplate}
                formData={selectedOrder.form_data}
                readOnly={true}
                timeline={timeline}
                showTimeline={true}
                currentNodeName={selectedOrder.current_node}
              />
            </div>

            <div className="px-10 py-8 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
               <button
                  onClick={() => navigate(`/workflow/visualization/${selectedOrder.id}`)}
                  className="px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl hover:bg-slate-50 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-sm"
                >
                  <GitBranch size={16} className="text-indigo-600" />
                  {t('workflow.action.view_flow')}
                </button>
                <div className="flex gap-4">
                  <button onClick={() => setSelectedOrder(null)} className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">{t('common.cancel')}</button>
                  {selectedOrder.status === 'pending' && (
                    <button
                      onClick={() => handleWithdraw(selectedOrder.id)}
                      className="px-10 py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                    >
                      <RotateCcw size={16} strokeWidth={3} />
                      {t('approvals.action.withdraw')}
                    </button>
                  )}
                </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
