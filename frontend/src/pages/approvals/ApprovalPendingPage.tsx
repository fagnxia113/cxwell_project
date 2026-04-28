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
  Zap,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Timer
} from 'lucide-react'
import { workflowApi } from '../../api/workflowApi'
import { useMessage } from '../../hooks/useMessage'
import { cn } from '../../utils/cn'
import { getFlowName } from '../../constants/workflowConstants'

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
  form_data?: Record<string, any>
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  'project': { label: '项目审批', color: 'indigo', icon: Layers },
  'hr': { label: '人资行政', color: 'blue', icon: User },
  'equipment': { label: '资产设备', color: 'emerald', icon: Zap },
  'default': { label: '通用事务', color: 'slate', icon: FileText }
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  'high': { label: '高优先级', color: 'text-rose-600', bgColor: 'bg-rose-50' },
  'normal': { label: '普通', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'low': { label: '低', color: 'text-slate-400', bgColor: 'bg-slate-100' }
}

const StatCard = ({ title, value, icon: Icon, color, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group"
  >
    <div className="relative z-10 flex items-center justify-between">
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-2xl font-black text-slate-900">{value}</h3>
      </div>
      <div className={cn("p-3 rounded-2xl shadow-lg", 
        color === 'blue' ? 'bg-indigo-600 text-white shadow-indigo-200' :
        color === 'amber' ? 'bg-orange-500 text-white shadow-orange-200' :
        'bg-emerald-500 text-white shadow-emerald-200'
      )}>
        <Icon size={20} />
      </div>
    </div>
  </motion.div>
)

export default function ApprovalPendingPage() {
  const navigate = useNavigate()
  const message = useMessage()
  const [tasks, setTasks] = useState<ApprovalTask[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'high' | 'normal' | 'low'>('all')
  const [searchKeyword, setSearchKeyword] = useState('')

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    setLoading(true)
    try {
      const res = await workflowApi.getHubTodo()
      setTasks(res?.data || [])
    } catch (e: any) {
      message.error(`任务库同步失败: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const filteredTasks = useMemo(() => tasks.filter(task => {
    if (filter !== 'all' && task.priority !== filter) return false
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase()
      return task.process_title.toLowerCase().includes(kw) || task.initiator_name.toLowerCase().includes(kw)
    }
    return true
  }), [tasks, filter, searchKeyword])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes()}`
  }

  return (
    <div className="max-w-full mx-auto space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-900/20">
              <Zap size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">待办审批</h1>
          </div>
          <p className="text-slate-500 font-medium">处理业务申请，把控核心决策</p>
        </div>

        <div className="flex gap-2">
           <button
            onClick={loadTasks}
            className="p-3.5 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 shadow-xl shadow-slate-200/50 transition-all active:scale-95"
          >
            <RotateCcw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          <button className="px-6 py-3.5 bg-emerald-500 text-white rounded-2xl text-sm font-black shadow-xl shadow-emerald-500/20 flex items-center gap-2 hover:-translate-y-1 transition-all">
            发起新申请
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="待处理" value={tasks.length} icon={Layers} color="blue" delay={0.1} />
        <StatCard title="加急" value={tasks.filter(t => t.priority === 'high').length} icon={AlertCircle} color="amber" delay={0.2} />
        <StatCard title="平均时效" value="1.5h" icon={Timer} color="emerald" delay={0.3} />
        <StatCard title="结案率" value="98%" icon={TrendingUp} color="blue" delay={0.4} />
      </div>

      <div className="bg-white/70 backdrop-blur-md p-4 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-wrap items-center gap-4">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
          {['all', 'high', 'normal'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={cn(
                "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                filter === f ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {f === 'all' ? '全部' : f === 'high' ? '加急' : '普通'}
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-[300px] relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
          <input
            type="text"
            placeholder="检索流程标题、申请人、业务单号..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-bold shadow-inner"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl p-0 overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">任务标识 (SN)</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">业务流主题</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">发起节点</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">当前步骤</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">执行协议</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({length: 3}).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="p-8 animate-pulse bg-slate-50/50 h-20" /></tr>
                ))
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-300">
                       <CheckCircle size={48} strokeWidth={1.5} />
                       <p className="text-sm font-bold uppercase tracking-widest">任务中心已清空，尽享片刻宁静</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task, idx) => {
                  const category = CATEGORY_CONFIG[task.process_type] || CATEGORY_CONFIG.default
                  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.normal
                  const Icon = category.icon
                  return (
                    <motion.tr
                      key={task.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => navigate(`/approvals/handle/${task.id}`)}
                      className="group hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      <td className="px-8 py-6">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                          {task.task_id.substring(0, 8)}
                        </span>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-4">
                          <div className={cn("p-2.5 rounded-2xl text-white shadow-lg", `bg-${category.color}-500 shadow-${category.color}-500/20`)}>
                            <Icon size={18} />
                          </div>
                          <div>
                            <div className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{getFlowName(task.process_type, task.process_title)}</div>
                            <div className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">{category.label} · {formatDate(task.created_at)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-600">
                            {task.initiator_name.substring(0, 1)}
                          </div>
                          <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">{task.initiator_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                          {task.node_name}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <div className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-slate-900/20 group-hover:bg-indigo-600 transition-all">
                             <ArrowRight size={18} />
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
