import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  Activity, 
  Package, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  RefreshCcw,
  Briefcase,
  Layers,
  FileSearch,
  Zap,
  ChevronRight
} from 'lucide-react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { dashboardApi } from '../../api/dashboardApi'
import { projectApi } from '../../api/projectApi'
import { cn } from '../../utils/cn'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const StatCard = ({ title, value, subValue, icon: Icon, color, index }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className="bg-white p-6 rounded-lg border border-slate-100/80 shadow-sm relative overflow-hidden group cursor-pointer"
  >
    <div className={cn(
      "absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-[0.03]",
      color === 'emerald' ? 'bg-emerald-500' : color === 'orange' ? 'bg-orange-500' : color === 'indigo' ? 'bg-indigo-500' : 'bg-slate-500'
    )} />
    <div className="flex items-center gap-5 relative z-10">
      <div className={cn(
        "p-4 rounded-2xl",
        color === 'emerald' ? 'bg-emerald-500 text-white' :
        color === 'orange' ? 'bg-orange-500 text-white' :
        color === 'indigo' ? 'bg-indigo-600 text-white' :
        'bg-slate-900 text-white'
      )}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1.5">{title}</p>
        <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{value}</h3>
        {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
      </div>
    </div>
  </motion.div>
)

export default function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [recentProjects, setRecentProjects] = useState<any[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [overRes, projRes] = await Promise.all([
        dashboardApi.getOverview(),
        projectApi.getProjects({ pageSize: 5 })
      ])
      
      // console.log('Dashboard Data Raw:', { overRes, projRes });

      if (overRes && overRes.data) {
        setData(overRes.data)
      } else if (overRes && overRes.success && overRes.distribution) {
        // 兼容直接返回数据格式
        setData(overRes)
      }

      if (projRes && projRes.data) {
        setRecentProjects(projRes.data.list || projRes.data || [])
      } else if (projRes && Array.isArray(projRes)) {
        setRecentProjects(projRes)
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('dashboard.loading_indicator') || 'Syncing...'}</p>
      </div>
    )
  }

  const { stats, trend, distribution } = data

  return (
    <div className="min-h-screen bg-mesh p-4 lg:p-6 space-y-4 animate-fade-in custom-scrollbar">
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-lg text-white">
              <Zap size={20} strokeWidth={2.5} />
            </div>
            {t('dashboard.digital_command_center')}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('dashboard.realtime_insights')}</p>
        </motion.div>

        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 shadow-sm transition-all text-sm font-medium flex items-center gap-2 hover:brightness-110"
        >
          <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
          <span>{t('dashboard.refresh')}</span>
        </button>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          index={0}
          title={t('dashboard.active_projects')}
          value={stats.projects.inProgress}
          subValue={`${t('dashboard.total')}: ${stats.projects.total}`}
          icon={Briefcase}
          color="emerald"
        />
        <StatCard
          index={1}
          title={t('dashboard.pending_processes')}
          value={stats.approvals.pending}
          subValue={`${t('dashboard.today_completed')}: ${stats.approvals.todayApproved}`}
          icon={CheckCircle2}
          color="orange"
        />
        <StatCard
          index={2}
          title={t('dashboard.compliance_rate')}
          value={`${stats.dailyReports.submissionRate}%`}
          subValue={`${t('dashboard.pending_submit')}: ${stats.dailyReports.unsubmitted}`}
          icon={FileSearch}
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Trend & Projects */}
        <div className="lg:col-span-8 space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm min-h-[360px] flex flex-col min-w-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-800">{t('dashboard.delivery_trend')}</h2>
                  <p className="text-[10px] text-slate-400 mt-0.5">{t('dashboard.delivery_trend_desc')}</p>
                </div>
              </div>
              <div className="w-full h-[300px] relative">
                {trend && trend.length > 0 && (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={trend}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 600}}
                      />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '8px 12px' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#6366f1"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                        animationDuration={2500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
           </div>

           <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-bold text-slate-800">{t('dashboard.projects_overview')}</h2>
                <button onClick={() => navigate('/projects')} className="text-[10px] font-semibold text-indigo-600 hover:bg-indigo-50 px-2.5 py-1 rounded-lg transition-all border border-indigo-100">
                  {t('dashboard.view_all')}
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                 {recentProjects.map((project, i) => (
                   <motion.div
                     key={project.id}
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: i * 0.1 }}
                     onClick={() => navigate(`/projects/${project.id}`)}
                     className="bg-white p-5 rounded-xl border border-slate-100 shadow-md shadow-slate-200/20 group cursor-pointer flex flex-col sm:flex-row items-center gap-5 hover:border-indigo-500/20 hover:bg-slate-50/50 transition-all"
                   >
                      <div className="w-12 h-12 shrink-0 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-slate-900/10 group-hover:bg-indigo-600 transition-all">
                        {(project.name || project.projectName || '?').charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex items-baseline gap-2">
                           <h3 className="text-[13px] font-black text-slate-800 truncate uppercase tracking-tight">{project.name || project.projectName || t('dashboard.unnamed_project')}</h3>
                           <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1 py-0.5 rounded uppercase tracking-tighter">ID: {project.id.toString().substring(0,8)}</span>
                         </div>
                         <div className="flex items-center gap-4 mt-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md"><Activity size={10}/> {t('dashboard.in_progress')}</span>
                            <span className="flex items-center gap-1"><Layers size={10}/> {t('dashboard.energy_infra') || '能源基建'}</span>
                         </div>
                      </div>
                      <div className="w-full sm:w-40">
                         <div className="flex justify-between text-[9px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">
                           <span>{t('dashboard.construction_progress')}</span>
                           <span className="text-slate-800">75%</span>
                         </div>
                         <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full w-3/4" />
                         </div>
                      </div>
                   </motion.div>
                 ))}
              </div>
           </div>
        </div>

        {/* Alerts & Distribution */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl shadow-slate-900/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                  </span>
                  {t('dashboard.risk_alert')}
                </h2>
              </div>
              <div className="space-y-3">
                 {[
                   { level: 'High', title: t('dashboard.alert_title') || 'Xuzhou Phase 2 Delay Risk', desc: t('dashboard.alert_desc') || 'Node [Earthwork] exceeded by 48h, manual intervention required.' }
                 ].map((w, i) => (
                   <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer group">
                      <div className="flex items-center gap-2 mb-1.5">
                         <span className={cn("text-[8px] font-black uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-md", 
                           w.level === 'High' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'
                         )}>Risk {w.level}</span>
                      </div>
                      <h4 className="text-[12px] font-black mb-1 uppercase tracking-tight">{w.title}</h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed italic">{w.desc}</p>
                   </div>
                 ))}
                 <button className="w-full mt-2 py-2.5 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all text-slate-500 hover:text-white border border-white/5">
                   {t('dashboard.view_all_alerts')}
                 </button>
              </div>
           </div>

           <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/30">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{t('dashboard.business_distribution')}</h2>
              <div className="h-[200px] w-full">
                {distribution && distribution.length > 0 && (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={distribution}
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {distribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                         contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                 {distribution.map((d: any, i: number) => (
                   <div key={i} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight">{d.name}: {d.value}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
