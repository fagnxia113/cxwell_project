/**
 * 我已处理页面 - 现代版
 * Premium High-Density List-Based UI
 */
import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  FileText,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Activity,
  Layers,
  ShieldCheck,
  History,
  Tag,
  ArrowUpRight,
  RotateCcw
} from 'lucide-react'
import { API_URL, parseJWTToken } from '../../config/api'
import { apiClient } from '../../utils/apiClient'
import { useMessage } from '../../hooks/useMessage'
import { cn } from '../../utils/cn'
import { useTranslation } from 'react-i18next'

interface ApprovedTask {
  id: string
  task_id: string
  process_id: string
  process_title: string
  process_type: string
  node_name: string
  initiator_name: string
  action: string
  comment?: string
  completed_at: string
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

export default function ApprovalCompletedPage() {
  const navigate = useNavigate()
  const { error: showError } = useMessage()
  const { t } = useTranslation()

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

  const ACTION_CONFIG: Record<string, { label: string; color: string; bgColor: string; border: string; icon: any }> = useMemo(() => ({
    'approved': { label: t('approval_completed.approved_status'), color: 'text-emerald-600', bgColor: 'bg-emerald-50', border: 'border-emerald-100', icon: CheckCircle },
    'rejected': { label: t('approval_completed.rejected_status'), color: 'text-rose-600', bgColor: 'bg-rose-50', border: 'border-rose-100', icon: XCircle }
  }), [t])

  const [tasks, setTasks] = useState<ApprovedTask[]>([])
  const [loading, setLoading] = useState(true)
  const [filterAction, setFilterAction] = useState<'all' | 'approved' | 'rejected'>('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)

  useEffect(() => { loadTasks() }, [])

  const loadTasks = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const userInfo = parseJWTToken(token || '')
      const result = await apiClient.get<any>(`${API_URL.BASE}/api/workflow/my-completed-tasks?userId=${userInfo.id}`)
      const taskData = result?.data || result
      if (Array.isArray(taskData)) setTasks(taskData)
    } catch (e: any) { showError(e.message || t('approval_completed.load_failed')) } finally { setLoading(false) }
  }

  const filteredTasks = useMemo(() => tasks.filter(task => {
    if (filterAction !== 'all' && task.action !== filterAction) return false
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase()
      if (!task.process_title.toLowerCase().includes(kw) && !task.initiator_name.toLowerCase().includes(kw)) return false
    }
    return true
  }), [tasks, filterAction, searchKeyword])

  const paginatedTasks = filteredTasks.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const totalPages = Math.ceil(filteredTasks.length / pageSize)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    })
  }

  const stats = useMemo(() => ({
    total: tasks.length,
    approved: tasks.filter(t => t.action === 'approved').length,
    efficiency: "99.2%",
    time: "4.8h"
  }), [tasks])

  return (
    <div className="min-h-screen bg-mesh p-4 lg:p-6 space-y-4 animate-fade-in custom-scrollbar">
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-2xl font-bold text-slate-700 flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg text-white shadow-brand">
              <History size={20} strokeWidth={2.5} />
            </div>
            {t('approval_completed.title')}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('approval_completed.subtitle')}</p>
        </motion.div>

        <button
          onClick={() => loadTasks()}
          className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
        >
          <RotateCcw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title={t('approval_completed.total')} value={stats.total} icon={Layers} color="blue" delay={0.1} />
        <StatCard title={t('approval_completed.approved')} value={stats.approved} icon={ShieldCheck} color="emerald" delay={0.2} />
        <StatCard title={t('approval_completed.quality')} value={stats.efficiency} icon={TrendingUp} color="indigo" delay={0.3} />
        <StatCard title={t('approval_completed.avg_time')} value={stats.time} icon={Clock} color="amber" delay={0.4} />
      </div>

      {/* Intelligence Filter Bar */}
      <div className="premium-card p-4 bg-white/60 backdrop-blur-xl border-none flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex bg-slate-100/50 p-1 rounded-lg gap-1">
          {['all', 'approved', 'rejected'].map((f) => (
            <button
              key={f}
              onClick={() => { setFilterAction(f as any); setCurrentPage(1) }}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                filterAction === f ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {f === 'all' ? t('approval_completed.all') : f === 'approved' ? t('approval_completed.approved_status') : t('approval_completed.rejected_status')}
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-[200px] relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={14} />
          <input
            type="text"
            placeholder={t('approval_completed.search_placeholder')}
            value={searchKeyword}
            onChange={(e) => { setSearchKeyword(e.target.value); setCurrentPage(1) }}
            className="input-standard pl-9 !py-2 text-sm bg-white/50 border-white focus:bg-white !rounded-lg w-full"
          />
        </div>
      </div>

      {/* Premium Rows List */}
      <div className="space-y-2 pb-16">
        <div className="grid grid-cols-12 gap-3 px-4 py-2 text-xs font-medium text-slate-400">
          <div className="col-span-1">{t('approval_completed.number')}</div>
          <div className="col-span-4">{t('approval_completed.task')}</div>
          <div className="col-span-2">{t('approval_completed.applicant')}</div>
          <div className="col-span-2">{t('approval_completed.node')}</div>
          <div className="col-span-2 text-center">{t('approval_completed.result')}</div>
          <div className="col-span-1"></div>
        </div>

        <AnimatePresence mode="popLayout">
          {loading ? (
             Array.from({length: 6}).map((_, i) => (
                <div key={i} className="premium-card h-20 bg-white/40 animate-pulse border-none" />
             ))
          ) : paginatedTasks.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center space-y-4 bg-white/30 rounded-2xl border border-dashed border-slate-200">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <History size={32} />
              </div>
              <p className="text-slate-400 text-sm">{t('approval_completed.no_records')}</p>
            </motion.div>
          ) : (
            paginatedTasks.map((task, idx) => {
              const typeConfig = ORDER_TYPE_LABELS[task.process_type as keyof typeof ORDER_TYPE_LABELS] || { label: task.process_type, color: 'slate', icon: FileText }
              const actionConfig = ACTION_CONFIG[task.action] || ACTION_CONFIG['approved']
              const TypeIcon = typeConfig.icon
              const ActionIcon = actionConfig.icon
              return (
                <motion.div
                  key={task.task_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  onClick={() => navigate(`/workflow/detail/${task.process_id}`)}
                  className="grid grid-cols-12 gap-3 px-4 py-3 items-center premium-card border-none bg-white hover:bg-slate-50 hover:shadow-md cursor-pointer transition-all group"
                >
                  <div className="col-span-1">
                     <span className="text-xs font-mono text-slate-400 group-hover:text-blue-600 transition-colors">
                        {task.task_id.substring(0, 6)}
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
                       typeConfig.color === 'violet' && 'bg-violet-600',
                       typeConfig.color === 'cyan' && 'bg-cyan-600',
                       typeConfig.color === 'teal' && 'bg-teal-600',
                       typeConfig.color === 'slate' && 'bg-slate-700'
                     )}>
                        <TypeIcon size={14} strokeWidth={2} />
                     </div>
                     <div className="min-w-0">
                        <h4 className="text-sm font-medium text-slate-700 leading-none mb-1 group-hover:text-blue-600 truncate">{task.process_title}</h4>
                        <div className="flex items-center gap-1.5">
                           <Calendar size={10} className="text-slate-300" />
                           <p className="text-xs text-slate-400">{typeConfig.label} · {formatDate(task.completed_at)}</p>
                        </div>
                     </div>
                  </div>

                  <div className="col-span-2">
                     <span className="text-xs text-slate-600">{task.initiator_name || t('common.system')}</span>
                  </div>

                  <div className="col-span-2">
                    <span className="text-xs text-indigo-600 font-medium">{task.node_name}</span>
                  </div>

                  <div className="col-span-2 text-center">
                     <div className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", actionConfig.bgColor, actionConfig.color)}>
                        <ActionIcon size={12} strokeWidth={2} />
                        {actionConfig.label}
                     </div>
                  </div>

                  <div className="col-span-1 text-right">
                     <div className="opacity-0 group-hover:opacity-100 transition-all flex items-center justify-end">
                        <div className="w-8 h-8 flex items-center justify-center text-white bg-slate-800 rounded-lg group-hover:bg-blue-500 transition-all">
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
              {t('approval_completed.records_count', { count: filteredTasks.length, current: currentPage, total: totalPages })}
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={(e) => { e.stopPropagation(); setCurrentPage(p => p - 1); }}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 text-xs font-medium border",
                  currentPage === 1 ? "bg-slate-50 border-slate-100 text-slate-300 pointer-events-none" : "bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600"
                )}
              >
                <ChevronLeft size={14} />
                {t('approval_completed.prev_page')}
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={(e) => { e.stopPropagation(); setCurrentPage(p => p + 1); }}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 text-xs font-medium border",
                  currentPage === totalPages ? "bg-slate-50 border-slate-100 text-slate-300 pointer-events-none" : "bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600"
                )}
              >
                {t('approval_completed.next_page')}
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}