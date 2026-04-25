import React from 'react';

import { 
  Activity, 
  Clock, 
  AlertCircle, 
  CheckCircle,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { RealtimeMonitoring, Statistics } from '../../../hooks/useWorkflowMonitor';

interface MonitorDashboardProps {
  realtimeData: RealtimeMonitoring;
  statistics: Statistics | null;
  formatDuration: (seconds?: number) => string;
}

export default function MonitorDashboard({ realtimeData, statistics, formatDuration }: MonitorDashboardProps) {

  const statusData = statistics ? [
    { name: '运行中', value: statistics.runningInstances, color: '#3B82F6' },
    { name: '已完成', value: statistics.completedInstances, color: '#10B981' },
    { name: '已终止', value: statistics.terminatedInstances, color: '#EF4444' },
  ] : [];

  const metrics = [
    { 
      label: '活跃流程', 
      value: realtimeData.activeInstances, 
      icon: Activity, 
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    { 
      label: '待办任务', 
      value: realtimeData.pendingTasks, 
      icon: Clock, 
      color: 'amber',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600'
    },
    { 
      label: '逾期任务', 
      value: realtimeData.overdueTasks, 
      icon: AlertCircle, 
      color: 'rose',
      bgColor: 'bg-rose-50',
      textColor: 'text-rose-600'
    },
    { 
      label: '今日完成', 
      value: realtimeData.todayCompleted, 
      icon: CheckCircle, 
      color: 'emerald',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((m, i) => (
          <div key={i} className="premium-card bg-white p-6 border-none shadow-sm rounded-2xl hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.label}</p>
                <p className={`text-3xl font-black ${m.textColor} tracking-tight`}>{m.value}</p>
              </div>
              <div className={`p-4 ${m.bgColor} rounded-2xl shadow-inner`}>
                <m.icon className={`w-6 h-6 ${m.textColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution Chart */}
        <div className="premium-card bg-white p-8 border-none shadow-sm rounded-3xl">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Activity size={18} className="text-blue-500" />
                状态分布
             </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={200}
                  animationDuration={1500}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Slowest Processes */}
        <div className="premium-card bg-white p-8 border-none shadow-sm rounded-3xl">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Clock size={18} className="text-amber-500" />
                处理最慢流程
             </h3>
             <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">实时告警</span>
          </div>
          <div className="space-y-4">
            {realtimeData.topSlowProcesses?.length > 0 ? (
              realtimeData.topSlowProcesses.map((process, index) => (
                <div
                  key={process.instanceId}
                  className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-white hover:shadow-md border border-slate-100/50 rounded-2xl transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 flex items-center justify-center bg-white shadow-sm border border-slate-100 rounded-xl text-xs font-black text-slate-400 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-400 transition-all">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-black text-slate-900 leading-tight mb-0.5">{process.title}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                         <Activity size={10} className="text-slate-300" />
                         {process.currentNode || '正在完成'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                      {formatDuration(process.duration)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-30 grayscale underline-offset-4 decoration-dotted">
                   <CheckCircle size={48} className="mb-4" />
                   <p className="text-xs font-black uppercase tracking-widest">所有流程运行良好</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
