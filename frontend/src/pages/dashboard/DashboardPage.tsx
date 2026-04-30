import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts'
import { apiClient } from '../../utils/apiClient'
import { 
  Globe, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCcw,
  Briefcase,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Target
} from 'lucide-react'
import { 
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip
} from 'recharts'
import { cn } from '../../utils/cn'

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

// Project Coordinates mapping
const ProjectCoords: Record<string, number[]> = {
  'China': [116.40, 39.90],
  'Vietnam': [105.83, 21.02],
  'Singapore': [103.81, 1.35],
  'Thailand': [100.50, 13.75],
  'Malaysia': [101.68, 3.13],
  'Philippines': [120.98, 14.59],
  'Indonesia': [106.84, -6.20],
  'Japan': [139.69, 35.68],
  'USA': [-77.03, 38.90],
  'Global': [0, 0]
};

const ProfessionalMap = ({ projects }: { projects: any[] }) => {
  const { t, i18n } = useTranslation();
  const [view, setView] = useState<'world' | 'china' | 'sea'>('world');
  const [mapLoaded, setMapLoaded] = useState(false);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;
    const loadMaps = async () => {
      try {
        const results = await Promise.all([
          echarts.getMap('world') ? Promise.resolve(null) : fetch('https://fastly.jsdelivr.net/npm/echarts@4.9.0/map/json/world.json').then(res => res.json()),
          echarts.getMap('china') ? Promise.resolve(null) : fetch('https://fastly.jsdelivr.net/npm/echarts@4.9.0/map/json/china.json').then(res => res.json())
        ]);
        
        if (results[0]) echarts.registerMap('world', results[0]);
        if (results[1]) echarts.registerMap('china', results[1]);
        
        if (isMounted) setMapLoaded(true);
      } catch (err) {
        console.error('Failed to load map data:', err);
      }
    };
    loadMaps();
    return () => { isMounted = false; };
  }, []); 

  const getMarkers = (region: string) => {
    return projects
      .filter(p => {
        const addr = (p.country || p.address || '').toLowerCase();
        if (region === 'china') return addr.includes('china') || addr.includes('中国');
        if (region === 'sea') return ['vietnam', 'singapore', 'thailand', 'malaysia', 'southeast'].some(k => addr.includes(k));
        return true;
      })
      .map(p => {
        const coord = ProjectCoords[p.country] || [110 + Math.random() * 20, 20 + Math.random() * 20];
        return {
          name: p.projectName || p.name,
          value: [...coord, p.progress || 0, p.id]
        };
      });
  };

  const option = useMemo(() => {
    if (!mapLoaded) return {};
    return {
      backgroundColor: 'transparent',
      title: {
        text: view === 'world' ? t('dashboard.global_operations') : t('dashboard.region_operations', { name: view.toUpperCase() }),
        left: 'center',
        top: 20,
        textStyle: { color: '#1e293b', fontSize: 14, fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.componentType === 'series' && params.seriesType === 'effectScatter') {
            return `<div class="p-2">
              <div class="font-bold text-slate-800 mb-1">${params.name}</div>
              <div class="text-xs text-emerald-500 font-bold">${t('common.progress')}: ${params.value[2]}%</div>
            </div>`;
          }
          return params.name;
        },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 0,
        extraCssText: 'box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border-radius: 8px;'
      },
      geo: {
        map: view === 'world' ? 'world' : 'china',
        roam: true,
        nameMap: i18n.language === 'zh' ? {
          'China': '中国',
          'Vietnam': '越南',
          'Singapore': '新加坡',
          'Thailand': '泰国',
          'Malaysia': '马来西亚',
          'Philippines': '菲律宾',
          'Indonesia': '印度尼西亚',
          'Japan': '日本',
          'United States': '美国',
          'Russia': '俄罗斯'
        } : undefined,
        emphasis: {
          label: { show: false },
          itemStyle: { areaColor: '#ecfdf5' }
        },
        itemStyle: {
          areaColor: '#f8fafc',
          borderColor: '#e2e8f0',
          borderWidth: 1
        }
      },
      legend: {
        show: true,
        bottom: 20,
        left: 'center',
        data: [t('dashboard.project_site')],
        textStyle: { color: '#64748b', fontSize: 10 }
      },
      series: [
        {
          name: t('dashboard.project_site'),
          type: 'effectScatter',
          coordinateSystem: 'geo',
          data: getMarkers(view),
          symbolSize: (val: any) => Math.max(8, val[2] / 5),
          showEffectOn: 'render',
          rippleEffect: { brushType: 'stroke', scale: 3 },
          emphasis: { scale: true },
          label: {
            formatter: '{b}',
            position: 'right',
            show: false
          },
          itemStyle: {
            color: '#00cc79',
            shadowBlur: 10,
            shadowColor: '#00cc79'
          },
          zlevel: 1
        }
      ]
    };
  }, [view, projects, mapLoaded, i18n.language, t]);

  const onChartClick = (params: any) => {
    if (view === 'world') {
      if (params.name === 'China') setView('china');
      else if (['Vietnam', 'Singapore', 'Thailand', 'Malaysia'].includes(params.name)) setView('sea');
    }
  };

  return (
    <div className="relative w-full h-[500px] bg-white rounded-lg border border-slate-100/80 shadow-sm overflow-hidden group">
      {!mapLoaded ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10 rounded-3xl">
           <div className="flex flex-col items-center gap-2">
             <RefreshCcw className="w-6 h-6 text-emerald-500 animate-spin" />
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('dashboard.initialising_map')}</span>
           </div>
        </div>
      ) : (
        <>
          <div className="absolute top-6 left-6 z-10">
            <div className="flex items-center gap-2 mb-2">
              <Globe size={16} className="text-emerald-500" />
              <span className="text-sm font-bold text-slate-800">{t('dashboard.global_command')}</span>
            </div>
          <AnimatePresence>
            {view !== 'world' && (
              <motion.button 
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                onClick={() => setView('world')}
                className="flex items-center gap-1 text-[10px] font-bold text-sky-500 uppercase tracking-widest"
              >
                <ChevronLeft size={12} /> {t('dashboard.back_to_world')}
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <ReactECharts 
          option={option} 
          style={{ height: '100%', width: '100%' }}
          onEvents={{ 'click': onChartClick }}
          ref={chartRef}
        />
      </>
      )}

      <div className="absolute bottom-6 right-6 flex items-center gap-4 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-500 uppercase">{t('dashboard.project_site')}</span>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color, delay }: any) => {
  const bg = color === 'emerald' ? 'bg-emerald-500' : color === 'amber' ? 'bg-amber-500' : color === 'indigo' ? 'bg-indigo-500' : color === 'rose' ? 'bg-rose-500' : 'bg-emerald-600';
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="bg-white p-6 rounded-lg border border-slate-100/80 shadow-sm relative overflow-hidden group">
      <div className={cn("absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-[0.03]", bg)} />
      <div className="flex items-center gap-5 relative z-10">
        <div className={cn("p-4 rounded-2xl", bg)}>
          <Icon size={24} strokeWidth={2.5} className="text-white" />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1.5">{title}</p>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{value}</h3>
        </div>
      </div>
    </motion.div>
  );
};

export default function DashboardPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>({
    stats: {
      projects: { total: 0, inProgress: 0, completed: 0 },
      approvals: { pending: 0 },
      milestoneCompletion: 0,
      riskAlert: 0
    }
  })
  const [projects, setProjects] = useState<any[]>([])
  const [risks, setRisks] = useState<any[]>([])

  const statusCodeToKey: Record<string, string> = {
    '1': 'preliminary',
    '2': 'initiated',
    '3': 'in_progress',
    '4': 'completed',
    '5': 'archived',
  };

  const distribution = useMemo(() => {
    const statusCount: Record<string, number> = {};
    projects.forEach(p => {
      const s = p.status || '0';
      statusCount[s] = (statusCount[s] || 0) + 1;
    });
    return Object.entries(statusCount)
      .filter(([_, v]) => v > 0)
      .map(([k, v]) => ({
        name: t(`project.status.${statusCodeToKey[k] || 'pending'}`),
        value: v
      }));
  }, [projects, t, i18n.language]);

  useEffect(() => { loadDashboardData() }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get<any>('/api/project/task-board');
      if (res && res.success && res.data) {
        const { stats, projects: projectList } = res.data;
        setData({ stats: stats || data.stats });
        setProjects(projectList || []);
        
        const allRisks = (projectList || []).flatMap((p: any) => 
          (p.risks || []).filter((r: any) => r.status !== 'resolved' && r.status !== 'closed').map((r: any) => ({ 
            ...r, 
            projectName: p.name || p.projectName 
          }))
        );
        setRisks(allRisks.slice(0, 5));
      }
    } catch (error) { 
      console.error('Failed to load dashboard data:', error);
    } finally { 
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">{t('dashboard.loading_indicator')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-mesh p-4 lg:p-6 space-y-4 animate-fade-in custom-scrollbar">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-lg text-white">
              <Globe size={20} strokeWidth={2.5} />
            </div>
            {t('dashboard.global_command')}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('dashboard.realtime_insights')}</p>
        </motion.div>
        <button onClick={loadDashboardData} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg shadow-sm transition-all text-sm font-medium flex items-center gap-2 hover:bg-slate-50">
          <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
          <span>{t('dashboard.refresh')}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard delay={0.1} title={t('dashboard.active')} value={data.stats.projects.inProgress} icon={Briefcase} color="emerald" />
        <StatCard delay={0.2} title={t('dashboard.pending')} value={data.stats.approvals.pending} icon={CheckCircle2} color="amber" />
        <StatCard delay={0.3} title={t('dashboard.milestone_completion')} value={`${data.stats.milestoneCompletion}%`} icon={Target} color="emerald" />
        <StatCard delay={0.4} title={t('dashboard.risk_alert')} value={data.stats.riskAlert} icon={AlertCircle} color="rose" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 space-y-4">
          <ProfessionalMap projects={projects} />
          
          <div className="flex items-center justify-between px-1 pt-2">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Target size={16} className="text-emerald-500" />
              {t('dashboard.projects_overview')}
            </h2>
            <button onClick={() => navigate('/projects')} className="text-[10px] font-bold text-emerald-500 hover:underline uppercase tracking-widest">{t('dashboard.view_all')}</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             {projects.slice(0, 6).map((p) => (
               <motion.div key={p.id} whileHover={{ y: -2 }} onClick={() => navigate(`/projects/${p.id}`)} className="p-4 bg-white border border-slate-100 rounded-xl hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group flex items-center gap-4">
                 <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">{(p.projectName || p.name || '?').charAt(0).toUpperCase()}</div>
                 <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 truncate">{p.projectName || p.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><MapPin size={10} /> {p.country || 'Global'}</span>
                      <span className="text-emerald-500 font-bold">{p.progress || 0}%</span>
                    </div>
                 </div>
                 <ChevronRight size={14} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
               </motion.div>
             ))}
          </div>
        </div>

        <div className="xl:col-span-4 space-y-4">
           <div className="bg-white p-6 rounded-lg border border-slate-100/80 shadow-sm min-h-[350px]">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-rose-50 text-rose-600 rounded-lg"><AlertCircle size={18} /></div>
                 <h2 className="text-sm font-bold text-slate-800">{t('dashboard.risk_alert')}</h2>
              </div>
              <div className="space-y-3">
                 {risks.length > 0 ? risks.map((r, i) => (
                   <motion.div key={i} className="p-3 bg-slate-50 rounded-xl border border-transparent hover:border-rose-100 transition-all cursor-pointer group">
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn("text-[8px] font-black px-1.5 py-0.5 rounded uppercase", r.level === 'high' || r.level === '1' ? "bg-rose-500 text-white" : "bg-amber-500 text-white")}>
                          {r.level === 'high' || r.level === '1' ? t('dashboard.high_risk') : t('dashboard.normal_risk')}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono truncate max-w-[120px]">{r.projectName}</span>
                      </div>
                      <h4 className="text-[11px] font-bold text-slate-700 mt-1">{r.title || r.riskDescription}</h4>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-[10px] text-slate-400 italic">{t('common.date')}: {r.deadline || 'ASAP'}</p>
                        <ChevronRight size={10} className="text-slate-300 group-hover:text-rose-500" />
                      </div>
                   </motion.div>
                 )) : (
                   <div className="py-10 text-center flex flex-col items-center gap-2">
                      <div className="p-3 bg-emerald-50 rounded-full text-emerald-500"><CheckCircle2 size={24} /></div>
                      <p className="text-xs text-slate-400 font-medium">{t('dashboard.no_critical_risks')}</p>
                   </div>
                 )}
              </div>
           </div>

           <div className="bg-white p-6 rounded-lg border border-slate-100/80 shadow-sm">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">{t('dashboard.business_distribution')}</h2>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={distribution} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value" stroke="none">
                      {distribution.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-50">
                 {distribution.map((d: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                       <span className="text-[10px] font-bold text-slate-500 uppercase truncate">{d.name}</span>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
