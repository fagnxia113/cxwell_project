import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  History,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  Layers,
  FileText,
  User,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RotateCcw
} from 'lucide-react'
import { workflowApi } from '../../api/workflowApi'
import { useMessage } from '../../hooks/useMessage'
import { cn } from '../../utils/cn'
import { getFlowName } from '../../constants/workflowConstants'

interface DoneTask {
  id: string
  task_id: string
  process_id: string
  process_title: string
  process_type: string
  node_name: string
  approver: string
  skip_type: string
  created_at: string
  update_time: string
  message?: string
}

export default function ApprovalCompletedPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const message = useMessage()
  const [tasks, setTasks] = useState<DoneTask[]>([])
  const [loading, setLoading] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState('')

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    setLoading(true)
    try {
      const res = await workflowApi.getDoneTasks()
      setTasks(res?.data || [])
    } catch (e: any) {
      message.error(t('approval_completed.load_failed'))
    } finally {
      setLoading(false)
    }
  }

  const filteredTasks = useMemo(() => tasks.filter(task => {
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase()
      return task.process_title.toLowerCase().includes(kw) || task.node_name.toLowerCase().includes(kw)
    }
    return true
  }), [tasks, searchKeyword])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}`
  }

  return (
    <div className="max-w-full mx-auto space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-900/20">
              <History size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t('approval_completed.title')}</h1>
          </div>
          <p className="text-slate-500 font-medium">{t('approval_completed.subtitle')}</p>
        </div>

        <button
          onClick={loadTasks}
          className="p-3.5 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 shadow-xl shadow-slate-200/50 transition-all active:scale-95"
        >
          <RotateCcw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="bg-white/70 backdrop-blur-md p-4 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
          <input
            type="text"
            placeholder={t('approval_completed.search_placeholder')}
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
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('approval_completed.task')}</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('approval_completed.node')}</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('approval_completed.result')}</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.comment')}</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{t('common.updateTime')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                Array.from({length: 4}).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="p-8 animate-pulse h-20 bg-slate-50/50" /></tr>
                ))
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">{t('approval_completed.no_records')}</p>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task, idx) => (
                  <motion.tr
                    key={task.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="group hover:bg-slate-50 transition-all cursor-pointer"
                    onClick={() => navigate(`/approvals/detail/${task.process_id}`)}
                  >
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-xl text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">
                             <FileText size={16} />
                          </div>
                          <div>
                            <div className="text-sm font-black text-slate-900 uppercase tracking-tight">{getFlowName(task.process_type, task.process_title)}</div>
                            <div className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest font-mono">ID: {task.process_id.substring(0,8)}</div>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className="text-xs font-bold text-slate-600">{task.node_name}</span>
                    </td>
                    <td className="px-6 py-6 font-mono">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest",
                        task.skip_type === 'PASS' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                        task.skip_type === 'REJECT' ? "bg-rose-50 text-rose-600 border border-rose-100" :
                        "bg-slate-50 text-slate-400 border border-slate-100"
                      )}>
                        {task.skip_type === 'PASS' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {task.skip_type}
                      </div>
                    </td>
                    <td className="px-6 py-6 max-w-[200px]">
                      <p className="text-xs text-slate-500 truncate italic">{task.message || '-'}</p>
                    </td>
                    <td className="px-8 py-6 text-right whitespace-nowrap">
                      <div className="text-xs font-bold text-slate-400 font-mono">{formatDate(task.update_time)}</div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}