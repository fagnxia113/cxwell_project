import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
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
  BarChart,
  Bar,
  Cell
} from 'recharts'
import { API_URL } from '../../config/api'
import { apiClient } from '../../utils/apiClient'
import { cn } from '../../utils/cn'
import { useTranslation } from 'react-i18next'

interface DashboardStats {
  projects: { total: number; inProgress: number; completed: number; delayed: number }
  tasks: { total: number; pending: number; inProgress: number; completed: number }
  equipment: { total: number; inWarehouse: number; inProject: number; repairing: number }
  approvals: { pending: number; todayApproved: number }
  dailyReports: { submitted: number; unsubmitted: number; submissionRate: number }
}

const StatCard = ({ title, value, subValue, icon: Icon, color, index }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className="premium-card p-6 group cursor-pointer relative overflow-hidden h-full flex flex-col justify-between"
  >
    <div className="flex items-start justify-between">
      <div className={cn("p-3 rounded-xl", `bg-${color}-50 text-${color}-600`)}>
        <Icon size={20} />
      </div>
      <div className="p-1 px-2 border border-slate-100 rounded-lg group-hover:bg-slate-50 transition-all">
        <ArrowUpRight className="text-slate-300 group-hover:text-primary" size={14} />
      </div>
    </div>

    <div className="mt-6">
      <p className="text-[11px] font-bold text-secondary uppercase tracking-widest mb-1.5 opacity-60 group-hover:opacity-100 transition-opacity">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-3xl font-bold text-primary leading-none">{value}</h3>
        {typeof subValue === 'string' && <span className="text-[10px] font-bold text-slate-400">{subValue}</span>}
      </div>
    </div>
  </motion.div>
)

export default function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats>({
    projects: { total: 0, inProgress: 0, completed: 0, delayed: 0 },
    tasks: { total: 0, pending: 0, inProgress: 0, completed: 0 },
    equipment: { total: 0, inWarehouse: 0, inProject: 0, repairing: 0 },
    approvals: { pending: 0, todayApproved: 0 },
    dailyReports: { submitted: 0, unsubmitted: 0, submissionRate: 0 }
  })
  const [recentProjects, setRecentProjects] = useState<any[]>([])
  const [warnings, setWarnings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // 模拟趋势数据
  const chartData = useMemo(() => [
    { name: 'Mon', value: 40 },
    { name: 'Tue', value: 35 },
    { name: 'Wed', value: 55 },
    { name: 'Thu', value: 45 },
    { name: 'Fri', value: 60 },
    { name: 'Sat', value: 80 },
    { name: 'Sun', value: 75 },
  ], [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [projData, projStats, equipStats, alertsData, reportsData, workflowStats] = await Promise.all([
        apiClient.get<any>(API_URL.PROJECTS.LIST + '?pageSize=5').catch(() => null),
        apiClient.get<any>(API_URL.PROJECTS.STATISTICS).catch(() => null),
        apiClient.get<any>(API_URL.EQUIPMENT.STATISTICS).catch(() => null),
        apiClient.get<any>(API_URL.NOTIFICATIONS.ALERTS + '?status=active').catch(() => null),
        apiClient.get<any>(API_URL.NOTIFICATIONS.DAILY_REPORT_STATISTICS).catch(() => null),
        apiClient.get<any>(API_URL.WORKFLOW.MONITORING).catch(() => null)
      ])

      if (projData) setRecentProjects(projData.data || [])
      
      setStats(prev => ({
        ...prev,
        projects: projStats?.data ? {
          total: projStats.data.total || 0,
          inProgress: projStats.data.in_progress || 0,
          completed: projStats.data.completed || 0,
          delayed: projStats.data.delayed || 0
        } : prev.projects,
        equipment: equipStats?.data ? {
          total: equipStats.data.total || 0,
          inWarehouse: equipStats.data.idle || 0,
          inProject: equipStats.data.inUse || 0,
          repairing: 0
        } : prev.equipment,
        approvals: workflowStats?.data ? {
          pending: workflowStats.data.pendingTasks || 0,
          todayApproved: workflowStats.data.todayCompleted || 0
        } : prev.approvals,
        dailyReports: reportsData ? {
          submitted: reportsData.total_submitted || 0,
          unsubmitted: reportsData.total_unsubmitted || 0,
          submissionRate: reportsData.submission_rate || 0
        } : prev.dailyReports
      }))

      if (alertsData) setWarnings(alertsData.data || [])

    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  return (
    <div className="min-h-screen bg-mesh p-4 lg:p-6 space-y-4 animate-fade-in custom-scrollbar overflow-y-auto max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-700 flex items-center gap-4">
            {t('dashboard.work_compliance_dashboard')}
            <div className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-full flex items-center gap-2">
               <Zap size={14} className="text-accent fill-accent" />
               <span className="text-[10px] font-black text-accent uppercase tracking-widest">Active System</span>
            </div>
          </h1>
          <p className="text-secondary font-bold text-sm mt-1.5 opacity-70 italic">Real-time Project & Asset Surveillance</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-emerald-600 hover:border-emerald-200 transition-all text-sm font-medium shadow-sm flex items-center gap-2"
          >
            <RefreshCcw size={14} className={cn(loading && "animate-spin")} />
            <span>{t('dashboard.refresh')}</span>
          </button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          index={0}
          title={t('dashboard.active_projects_count')}
          value={stats.projects.inProgress}
          subValue={t('dashboard.total_count', { count: stats.projects.total })}
          icon={Briefcase}
          color="emerald"
        />
        <StatCard
          index={1}
          title={t('dashboard.pending_approvals_count')}
          value={stats.approvals.pending}
          subValue={t('dashboard.today_completed', { count: stats.approvals.todayApproved })}
          icon={CheckCircle2}
          color="orange"
        />
        <StatCard
          index={2}
          title={t('dashboard.asset_real_time_load')}
          value={`${((stats.equipment.inProject / (stats.equipment.total || 1)) * 100).toFixed(0)}%`}
          subValue={t('dashboard.on_site_count', { inProject: stats.equipment.inProject, total: stats.equipment.total })}
          icon={Package}
          color="indigo"
        />
        <StatCard
          index={3}
          title={t('dashboard.compliance_daily_report_rate')}
          value={`${stats.dailyReports.submissionRate}%`}
          subValue={t('dashboard.unsubmitted_count', { count: stats.dailyReports.unsubmitted })}
          icon={FileSearch}
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Trends & Projects */}
        <div className="lg:col-span-8 space-y-8">
          {/* Progress Chart */}
          <div className="premium-card p-6 bg-white min-h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">{t('dashboard.efficiency_trend')}</h2>
                <p className="text-xs font-medium text-slate-400">{t('dashboard.last_7_days_trend')}</p>
              </div>
              <div className="flex p-1 bg-slate-100 rounded-xl">
                <button className="px-3 py-1 scale-95 text-xs font-bold bg-white text-slate-900 rounded-lg shadow-sm">{t('dashboard.efficiency')}</button>
                <button className="px-3 py-1 scale-95 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">{t('dashboard.output_value')}</button>
              </div>
            </div>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00cc79" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#00cc79" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12}} 
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#00cc79" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Project List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                {t('dashboard.active_projects_overview')}
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] rounded-full">{recentProjects.length}</span>
              </h2>
              <button
                onClick={() => navigate('/projects')}
                className="text-xs font-bold text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-all"
              >
                {t('dashboard.view_full_list')}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {recentProjects.length > 0 ? (
                recentProjects.map((project, i) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="premium-card p-5 group cursor-pointer flex flex-col sm:flex-row items-start sm:items-center gap-4 border-l-4 border-l-transparent hover:border-l-primary"
                  >
                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-slate-50 flex items-center justify-center text-primary font-black text-xl border border-slate-100 group-hover:bg-primary group-hover:text-white transition-all">
                      {project.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-slate-800">{project.name}</h3>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1 rounded uppercase tracking-tighter">{project.code}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                          <Activity size={10} />
                          {project.status === 'in_progress' ? t('dashboard.in_progress') : t('dashboard.completed')}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                          <CheckCircle2 size={10} />
                          {project.completionTime || t('dashboard.expected_q3_delivery')}
                        </div>
                      </div>
                    </div>
                    <div className="w-full sm:w-48 pt-2 sm:pt-0">
                      <div className="flex justify-between text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                         <span>{t('dashboard.current_progress')}</span>
                        <span className="text-slate-900">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${project.progress}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className={cn(
                            "h-full rounded-full transition-all",
                            project.progress > 80 ? "bg-emerald-500" : "bg-primary"
                          )}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="premium-card p-12 text-center text-slate-300 font-bold border-dashed flex flex-col items-center gap-4">
                  <Briefcase size={40} className="text-slate-100" />
                  {t('dashboard.no_active_projects')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Warnings & Actions */}
        <div className="lg:col-span-4 space-y-8">
          {/* Intelligence Alerts */}
          <div className="premium-card p-6 bg-slate-900 shadow-2xl shadow-blue-900/10">
            <h2 className="text-lg font-black text-white tracking-tight mb-6 flex items-center justify-between">
              {t('dashboard.central_alert_overview')}
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </h2>
            <div className="space-y-4">
              {warnings.length > 0 ? (
                warnings.map((w, i) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    key={w.id}
                    className={cn(
                      "p-4 rounded-2xl border transition-all hover:scale-[1.02]",
                      w.alert_level === 'severe'
                        ? 'bg-red-500/10 border-red-500/20'
                        : 'bg-amber-500/10 border-amber-500/20'
                    )}
                  >
                    <div className="flex gap-3">
                      <div className={cn(
                        "mt-1 p-1.5 rounded-lg",
                        w.alert_level === 'severe' ? 'text-red-500' : 'text-amber-500'
                      )}>
                        <AlertCircle size={16} />
                      </div>
                      <div className="flex-1">
                        <p className={cn(
                          "text-xs font-black uppercase tracking-widest leading-none mb-1",
                          w.alert_level === 'severe' ? 'text-red-400' : 'text-amber-400'
                         )}>{w.alert_level === 'severe' ? t('dashboard.severe_alert') : t('dashboard.normal_alert')}</p>
                        <p className="text-sm font-bold text-white mb-1.5">{w.project_name}</p>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{w.entity_name} {t('dashboard.status_abnormal_message')}</p>
                        <button className="mt-3 text-[10px] font-black text-white/50 hover:text-white transition-colors uppercase tracking-[0.2em] flex items-center gap-1 group">
                           {t('dashboard.view_details')} <ChevronRight size={10} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <CheckCircle2 size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs font-bold">{t('dashboard.all_nodes_status_good')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Command Launcher */}
          <div className="space-y-4">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">{t('dashboard.quick_actions')}</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: t('dashboard.project_boarding'), icon: Layers, path: '/projects/new', color: 'blue' },
                { label: t('dashboard.asset_inbound'), icon: Package, path: '/equipment/inbound', color: 'indigo' },
                { label: t('dashboard.task_control'), icon: CheckCircle2, path: '/tasks/board', color: 'violet' },
                { label: t('dashboard.business_audit'), icon: BarChart3, path: '/reports/dashboard', color: 'emerald' }
              ].map((act, i) => (
                <button 
                  key={i} 
                  onClick={() => navigate(act.path)} 
                  className="p-5 bg-white border border-slate-100 rounded-3xl hover:border-primary/20 hover:shadow-xl hover:shadow-primary/10 transition-all text-left flex flex-col gap-4 group relative overflow-hidden"
                >
                  <div className={cn(
                    "p-2.5 rounded-xl w-fit transition-transform group-hover:scale-110 group-hover:rotate-6",
                    `bg-${act.color}-50 text-${act.color}-600`
                  )}>
                    <act.icon size={20} />
                  </div>
                  <span className="text-sm font-black text-slate-800 leading-tight">{act.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
