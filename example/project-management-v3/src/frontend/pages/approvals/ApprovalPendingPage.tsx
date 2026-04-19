/**
 * 待办审批页面 - 现代版
 * Premium High-Density List-Based UI
 */
import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Calendar,
  User,
  ArrowRight,
  Layers,
  TrendingUp,
  ShieldCheck,
  Zap,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Timer,
  Plus
} from 'lucide-react'
import { useUser } from '../../contexts/UserContext'
import { useMessage } from '../../hooks/useMessage'
import { apiClient } from '../../utils/apiClient'
import { API_URL } from '../../config/api'
import { cn } from '../../utils/cn'
import { useTranslation } from 'react-i18next'
import { RotateCcw } from 'lucide-react'

interface ApprovalTask {
  id: string
  task_id: string
  process_id: string
  process_title: string
  process_type: string
  node_name: string
  initiator_name: string
  created_at: string
  priority: 'high' | 'normal' | 'low'
  form_data: Record<string, any>
  timeout?: number
}

const getProcessTypeLabels = (t: any): Record<string, { label: string; color: string; icon: any }> => ({
  'person_onboard': { label: t('workflow.categories.hr'), color: 'blue', icon: User },
  'personnel_onboard': { label: t('workflow.categories.hr'), color: 'blue', icon: User },
  'personnel_offboard': { label: t('workflow.categories.hr'), color: 'rose', icon: User },
  'personnel_transfer': { label: t('workflow.categories.hr'), color: 'indigo', icon: GitBranch },
  'personnel_leave': { label: t('workflow.categories.hr'), color: 'amber', icon: Calendar },
  'personnel_trip': { label: t('workflow.categories.hr'), color: 'cyan', icon: Calendar },
  'equipment_inbound': { label: t('workflow.categories.equipment'), color: 'emerald', icon: FileText },
  'equipment_outbound': { label: t('workflow.categories.equipment'), color: 'orange', icon: FileText },
  'equipment_transfer': { label: t('workflow.categories.equipment'), color: 'violet', icon: GitBranch },
  'equipment_repair': { label: t('workflow.categories.equipment'), color: 'pink', icon: Zap },
  'equipment_scrap': { label: t('workflow.categories.equipment'), color: 'slate', icon: FileText },
  'project_completion': { label: t('workflow.categories.project'), color: 'indigo', icon: ShieldCheck },
  'purchase_request': { label: t('workflow.categories.purchase'), color: 'teal', icon: Zap }
})

const getPriorityConfig = (t: any): Record<string, { label: string; color: string; bgColor: string; border: string }> => ({
  'high': { label: t('workflow.priority.high_desc'), color: 'text-rose-600', bgColor: 'bg-rose-50', border: 'border-rose-100' },
  'normal': { label: t('workflow.priority.normal_desc'), color: 'text-blue-600', bgColor: 'bg-blue-50', border: 'border-blue-100' },
  'low': { label: t('workflow.priority.low_desc'), color: 'text-slate-500', bgColor: 'bg-slate-50', border: 'border-slate-100' }
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

export default function ApprovalPendingPageNew() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useUser()
  const { error } = useMessage()
  const PROCESS_TYPE_LABELS = getProcessTypeLabels(t)
  const PRIORITY_CONFIG = getPriorityConfig(t)
  const [tasks, setTasks] = useState<ApprovalTask[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'high' | 'normal' | 'low'>('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)

  useEffect(() => { if (user?.id) loadTasks() }, [user?.id])

  const loadTasks = async () => {
    setLoading(true)
    try {
      const userId = user?.id || 'current-user'
      const result = await apiClient.get<any>(`${API_URL.BASE}/api/workflow/v2/tasks/assignee/${userId}?status=assigned,in_progress`)
      const tasksData = result?.data || result
      if (tasksData && Array.isArray(tasksData)) {
        setTasks(tasksData.map((item: any) => ({
          id: item.id,
          task_id: item.id,
          process_id: item.instance_id,
          process_title: item.process_title || item.name,
          process_type: item.definition_key || item.process_type,
          node_name: item.name,
          initiator_name: item.initiator_name,
          created_at: item.created_at,
          priority: item.priority || 'normal',
          form_data: item.variables?.formData || {},
          timeout: item.timeout
        })))
      }
    } catch (e: any) { error(`加载待办任务失败: ${e.message}`) } finally { setLoading(false) }
  }

  const filteredTasks = useMemo(() => tasks.filter(task => {
    if (filter !== 'all' && task.priority !== filter) return false
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase()
      if (!task.process_title.toLowerCase().includes(kw) && !task.initiator_name.toLowerCase().includes(kw)) return false
    }
    return true
  }), [tasks, filter, searchKeyword])

  const paginatedTasks = filteredTasks.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const totalPages = Math.ceil(filteredTasks.length / pageSize)

  const formatDate = (dateStr: string) => {
    const diff = new Date().getTime() - new Date(dateStr).getTime()
    const hours = diff / (1000 * 3600)
    if (hours < 1) return t('common.just_arrived')
    if (hours < 24) return `${Math.floor(hours)} ${t('common.hours_ago')}`
    return `${Math.floor(hours / 24)} ${t('common.days_ago')}`
  }

  const stats = useMemo(() => ({
    total: tasks.length,
    high: tasks.filter(t => t.priority === 'high').length,
    avgTime: "2.4h",
    completion: "94%"
  }), [tasks])

  return (
    <div className="min-h-screen bg-mesh p-4 lg:p-6 space-y-4 animate-fade-in custom-scrollbar">
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-3xl font-black text-[#313a72] tracking-tight flex items-center gap-4">
            <div className="p-2.5 bg-[#313a72] text-white rounded-xl shadow-lg shadow-[#313a72]/20">
              <Zap size={24} strokeWidth={2.5} />
            </div>
            {t('workflow.pending_center')}
          </h1>
          <p className="text-[#4b648c] font-bold text-sm mt-1.5 opacity-70 italic">Critical Workflow Tasks Requiring Your Professional Review</p>
        </motion.div>

        <div className="flex gap-3">
          <button
            onClick={() => loadTasks()}
            className="p-3 bg-white rounded-xl border-2 border-slate-100 text-[#313a72] hover:bg-slate-50 hover:shadow-md transition-all active:scale-95"
            title="Reload Environment"
          >
            <RotateCcw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => navigate('/approvals/new')} className="px-6 py-3 bg-[#00cc79] text-white rounded-xl hover:bg-[#00cc79]/90 transition-all shadow-lg shadow-[#00cc79]/20 flex items-center gap-2 text-sm font-black active:scale-95">
            <Plus size={18} strokeWidth={2.5} />
            <span>{t('workflow.new_process')}</span>
          </button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title={t('workflow.stats.pending_tasks')} value={stats.total} icon={Layers} color="blue" delay={0.1} />
        <StatCard title={t('workflow.stats.urgent_tasks')} value={stats.high} icon={AlertCircle} color="amber" delay={0.2} />
        <StatCard title={t('workflow.stats.avg_response')} value={stats.avgTime} icon={Timer} color="emerald" delay={0.3} />
        <StatCard title={t('workflow.stats.completion_rate')} value={stats.completion} icon={TrendingUp} color="indigo" delay={0.4} />
      </div>

      {/* Intelligence Filter Bar */}
      <div className="premium-card p-4 bg-white/60 backdrop-blur-xl border-none flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex bg-slate-100/50 p-1 rounded-lg gap-1">
          {['all', 'high', 'normal', 'low'].map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f as any); setCurrentPage(1) }}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                filter === f ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {f === 'all' ? t('common.all') : f === 'high' ? t('workflow.priority.high') : f === 'normal' ? t('workflow.priority.normal') : t('workflow.priority.low')}
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-[200px] relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={14} />
          <input
            type="text"
            placeholder={t('workflow.placeholder.search_tasks')}
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
          <div className="col-span-4">{t('workflow.fields.task_name') || t('workflow.fields.title')}</div>
          <div className="col-span-2">{t('workflow.fields.applicant') || t('workflow.fields.initiator')}</div>
          <div className="col-span-2">{t('workflow.fields.current_node')}</div>
          <div className="col-span-2 text-center">{t('workflow.fields.priority')}</div>
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
                <CheckCircle size={32} />
              </div>
              <p className="text-slate-400 text-sm">{t('workflow.no_pending')}</p>
            </motion.div>
          ) : (
            paginatedTasks.map((task, idx) => {
              const typeConfig = PROCESS_TYPE_LABELS[task.process_type] || { label: task.process_type, color: 'slate', icon: FileText }
              const prioConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG['normal']
              const TypeIcon = typeConfig.icon
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  onClick={() => navigate(`/workflow/detail/${task.process_id}`)}
                  className="grid grid-cols-12 gap-3 px-4 py-3 items-center premium-card border-none bg-white hover:bg-slate-50 hover:shadow-md cursor-pointer transition-all group"
                >
                  <div className="col-span-1">
                     <span className="text-xs font-mono text-slate-400 group-hover:text-emerald-600 transition-colors">
                        {task.task_id.substring(0, 6)}
                     </span>
                  </div>

                  <div className="col-span-4 flex items-center gap-3">
                     <div className={cn(
                       "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white",
                       `bg-${typeConfig.color}-600`,
                       typeConfig.color === 'blue' && 'bg-blue-600',
                       typeConfig.color === 'emerald' && 'bg-emerald-600',
                       typeConfig.color === 'amber' && 'bg-amber-600',
                       typeConfig.color === 'indigo' && 'bg-indigo-600',
                       typeConfig.color === 'pink' && 'bg-pink-600',
                       typeConfig.color === 'rose' && 'bg-rose-600',
                       typeConfig.color === 'violet' && 'bg-violet-600',
                       typeConfig.color === 'cyan' && 'bg-cyan-600',
                       typeConfig.color === 'teal' && 'bg-teal-600'
                     )}>
                        <TypeIcon size={14} strokeWidth={2} />
                     </div>
                     <div className="min-w-0">
                        <h4 className="text-sm font-medium text-slate-700 leading-none mb-1 group-hover:text-emerald-600 truncate">{task.process_title}</h4>
                        <div className="flex items-center gap-1.5">
                           <Clock size={10} className="text-slate-300" />
                           <p className="text-xs text-slate-400">{typeConfig.label} · {formatDate(task.created_at)}</p>
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
                     <div className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", prioConfig.bgColor, prioConfig.color)}>
                        {prioConfig.label}
                     </div>
                  </div>

                  <div className="col-span-1 text-right">
                     <div className="opacity-0 group-hover:opacity-100 transition-all flex items-center justify-end">
                        <div className="w-8 h-8 flex items-center justify-center text-white bg-slate-800 rounded-lg group-hover:bg-emerald-500 transition-all">
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
              {t('common.total')} <span className="font-medium text-slate-700">{filteredTasks.length}</span> {t('common.records')}，{t('common.page')} <span className="font-medium text-slate-700">{currentPage}</span> / <span className="font-medium text-slate-700">{totalPages}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={(e) => { e.stopPropagation(); setCurrentPage(p => p - 1); }}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 text-xs font-medium border",
                  currentPage === 1 ? "bg-slate-50 border-slate-100 text-slate-300 pointer-events-none" : "bg-white border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-600"
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
                  currentPage === totalPages ? "bg-slate-50 border-slate-100 text-slate-300 pointer-events-none" : "bg-white border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-600"
                )}
              >
                {t('common.next_page')}
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
