import React, { useState, useEffect } from 'react';

import { 
  RefreshCw, 
  Activity, 
  Play, 
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
    <div className="min-h-screen bg-slate-50/50 flex flex-col">
      {/* 顶部标题栏 */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="px-8 py-6 max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">工作流监控</h1>
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">实时监控工作流运行状态</p>
            </div>
          </div>
          <button
            onClick={() => fetchData(filterStatus)}
            disabled={loading}
            className="flex items-center px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 mr-2", loading && "animate-spin")} />
            刷新数据
          </button>
        </div>

        {/* 标签页切换 */}
        <div className="px-8 max-w-[1600px] mx-auto hidden md:block">
          <div className="flex space-x-10">
            {[
              { key: 'overview', label: '总览', icon: Activity },
              { key: 'instances', label: '实例', icon: Play },
              { key: 'statistics', label: '统计', icon: BarChartIcon }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={cn(
                  "flex items-center py-5 px-1 border-b-[3px] font-black text-[11px] uppercase tracking-widest transition-all",
                  activeTab === key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                <Icon className="w-4 h-4 mr-2.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <main className="flex-1 p-8 max-w-[1600px] mx-auto w-full">
        {loading && !realtimeData && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
             <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin" />
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">正在同步引擎数据...</p>
          </div>
        )}

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
      </main>

      {/* 4. 实例详情覆盖层 */}
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

      {/* 5. 行政干预表单弹窗 */}
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

export default WorkflowMonitorPage;
