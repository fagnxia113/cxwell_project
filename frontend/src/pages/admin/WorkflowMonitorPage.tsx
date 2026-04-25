import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RefreshCw, 
  Activity as ActivityIcon, 
  Play, 
  Search,
  BarChart as BarChartIcon 
} from 'lucide-react';
import { cn } from '../../utils/cn';

// Custom Hooks
import { useWorkflowMonitor } from '../../hooks/useWorkflowMonitor';

// Sub-components
import MonitorDashboard from '../../components/admin/workflow/MonitorDashboard';
import MonitorInstanceTable from '../../components/admin/workflow/MonitorInstanceTable';
import MonitorStatisticsView from '../../components/admin/workflow/MonitorStatisticsView';
import InstanceDetailOverlay from '../../components/admin/workflow/InstanceDetailOverlay';
import AdminInterventionForm from '../../components/admin/workflow/AdminInterventionForm';

/**
 * 流程监控管理页 (重构版)
 * 核心设计：Hook 驱动的集中式状态管理 + 职责单一的仪表盘组件
 * 核心功能：实时监控、统计分析、人工干预（强制审批/跳转/回滚）
 */
const WorkflowMonitorPage: React.FC = () => {
  const { 
    instances, 
    statistics, 
    realtimeData, 
    loading, 
    selectedInstance, 
    instanceTasks, 
    instanceHistory, 
    fetchData, 
    fetchInstanceDetail, 
    executeIntervention,
    setSelectedInstance
  } = useWorkflowMonitor();

  // Local UI States
  const [activeTab, setActiveTab] = useState<'overview' | 'instances' | 'statistics'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [initialInterventionTask, setInitialInterventionTask] = useState<any>(null);

  // 自动刷新逻辑 (30秒)
  useEffect(() => {
    fetchData(filterStatus);
    const interval = setInterval(() => fetchData(filterStatus), 30000);
    return () => clearInterval(interval);
  }, [fetchData, filterStatus]);

  // 工具方法：格式化时长
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-mesh p-4 lg:p-6 space-y-4 animate-fade-in custom-scrollbar">
      {/* Standard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg text-white">
              <ActivityIcon size={20} strokeWidth={2.5} />
            </div>
            工作流监控
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">实时监控运行状态与系统性能指标</p>
        </motion.div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(filterStatus)}
            disabled={loading}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg shadow-sm transition-all text-sm font-medium flex items-center gap-2 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>刷新数据</span>
          </button>
        </div>
      </div>

      {/* Analytics Dashboard (Standard StatCards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="运行中实例" value={statistics?.activeCount || 0} icon={Play} color="emerald" delay={0.1} />
        <StatCard title="今日异常" value={statistics?.errorCount || 0} icon={ActivityIcon} color="rose" delay={0.2} />
        <StatCard title="平均处理时长" value={formatDuration(statistics?.avgDuration)} icon={RefreshCw} color="blue" delay={0.3} />
        <StatCard title="待干预任务" value={statistics?.pendingIntervention || 0} icon={RefreshCw} color="amber" delay={0.4} />
      </div>

      {/* Intelligence Filter Bar (Standard) */}
      <div className="premium-card p-4 bg-white/60 backdrop-blur-xl border-none flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-lg">
          {[
            { key: 'overview', label: '总览', icon: ActivityIcon },
            { key: 'instances', label: '实例', icon: Play },
            { key: 'statistics', label: '统计', icon: BarChartIcon }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2",
                activeTab === key
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
        
        <div className="flex-1 min-w-[200px] relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={14} />
          <input
            type="text"
            placeholder="搜索实例名称或单据编号..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-standard pl-9 !py-2 text-sm bg-white/50 border-white focus:bg-white !rounded-lg w-full"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        <AnimatePresence mode="wait">
          {loading && !realtimeData ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-24 text-center space-y-6 bg-white/30 rounded-2xl border border-dashed border-slate-200"
            >
               <div className="w-16 h-16 border-4 border-slate-100 border-t-primary rounded-full animate-spin mx-auto" />
               <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-sm">同步中...</p>
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* 1. 总览页 (Dashboard) */}
              {activeTab === 'overview' && realtimeData && (
                <MonitorDashboard 
                  realtimeData={realtimeData} 
                  statistics={statistics} 
                  formatDuration={formatDuration} 
                />
              )}

              {/* 2. 实例列表 (Instance Table) */}
              {activeTab === 'instances' && (
                <MonitorInstanceTable 
                  instances={instances}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  filterStatus={filterStatus}
                  setFilterStatus={setFilterStatus}
                  onView={(inst) => {
                    fetchInstanceDetail(inst.id);
                  }}
                  onIntervene={(inst) => {
                    setSelectedInstance(inst);
                    setInitialInterventionTask(null);
                    setShowInterventionModal(true);
                  }}
                  formatDuration={formatDuration}
                />
              )}

              {/* 3. 统计报表 (Statistics) */}
              {activeTab === 'statistics' && statistics && (
                <MonitorStatisticsView statistics={statistics} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals & Overlays */}
      {selectedInstance && !showInterventionModal && (
        <InstanceDetailOverlay 
          instance={selectedInstance}
          tasks={instanceTasks}
          history={instanceHistory}
          onClose={() => setSelectedInstance(null)}
          onIntervene={(task) => {
            setInitialInterventionTask(task || null);
            setShowInterventionModal(true);
          }}
        />
      )}

      {showInterventionModal && selectedInstance && (
        <AdminInterventionForm 
          instance={{...selectedInstance, tasks: instanceTasks} as any}
          initialTask={initialInterventionTask}
          onClose={() => setShowInterventionModal(false)}
          onConfirm={executeIntervention}
        />
      )}
    </div>
  );
};

// Standard StatCard implementation
const StatCard = ({ title, value, icon: Icon, color, delay }: any) => {
  const colorConfig: Record<string, { bg: string; text: string }> = {
    emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600' },
    blue: { bg: 'bg-blue-500', text: 'text-blue-600' },
    indigo: { bg: 'bg-indigo-500', text: 'text-indigo-600' },
    amber: { bg: 'bg-amber-500', text: 'text-amber-600' },
    rose: { bg: 'bg-rose-500', text: 'text-rose-600' }
  }
  const config = colorConfig[color] || colorConfig.blue

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', damping: 25 }}
      className="bg-white p-6 rounded-lg border border-slate-100/80 shadow-sm relative overflow-hidden group"
    >
      <div className={cn(
        "absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-[0.03]",
        config.bg
      )} />
      <div className="flex items-center gap-5 relative z-10">
        <div className={cn("p-4 rounded-2xl", config.bg)}>
          <Icon size={24} strokeWidth={2.5} className="text-white" />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1.5">{title}</p>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{value}</h3>
        </div>
      </div>
    </motion.div>
  )
}

export default WorkflowMonitorPage;
