import React from 'react';

import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { BarChart as BarChartIcon, CheckCircle2, XCircle } from 'lucide-react';
import { Statistics } from '../../../hooks/useWorkflowMonitor';

interface MonitorStatisticsViewProps {
  statistics: Statistics;
}

const t = (key: string): string => {
  const map: Record<string, string> = {
    'workflow_monitor.process_type_stats': '各类型流程运行统计',
    'workflow_monitor.total': '总计',
    'workflow_monitor.status_map.running': '运行中',
    'workflow_monitor.status_map.completed': '已完成',
    'workflow_monitor.approval_rate': '审批通过率',
    'workflow_monitor.overall_rate': '整体通过率',
    'workflow_monitor.approved': '通过',
    'workflow_monitor.rejected': '驳回'
  };
  return map[key] || key;
};

export default function MonitorStatisticsView({ statistics }: MonitorStatisticsViewProps) {

  const processTypeData = statistics.byProcessKey ? Object.entries(statistics.byProcessKey).map(([key, data]) => ({
    name: key,
    total: data.total,
    running: data.running,
    completed: data.completed
  })) : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Process Type Statistics Bar Chart */}
        <div className="lg:col-span-2 premium-card bg-white p-8 border-none shadow-sm rounded-3xl">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 leading-none">
                <BarChartIcon size={18} className="text-purple-500" />
                {t('workflow_monitor.process_type_stats')}
             </h3>
             <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Volume comparison</span>
          </div>
          <div className="h-[400px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processTypeData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Legend 
                  iconType="circle" 
                  wrapperStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em', height: 40 }} 
                />
                <Bar dataKey="total" fill="#8B5CF6" radius={[6, 6, 0, 0]} name={t('workflow_monitor.total') || 'Total'} barSize={32} />
                <Bar dataKey="running" fill="#3B82F6" radius={[6, 6, 0, 0]} name={t('workflow_monitor.status_map.running')} barSize={32} />
                <Bar dataKey="completed" fill="#10B981" radius={[6, 6, 0, 0]} name={t('workflow_monitor.status_map.completed')} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Approval Health Metrics */}
        <div className="premium-card bg-slate-900 p-8 border-none shadow-xl rounded-3xl flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <CheckCircle2 size={240} className="text-white" />
          </div>
          
          <div className="relative z-10 space-y-12">
            <div className="text-center space-y-2">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{t('workflow_monitor.approval_rate')}</p>
              <div className="text-6xl font-black text-emerald-400 tracking-tighter tabular-nums drop-shadow-sm">
                {(statistics.approvalRate * 100).toFixed(1)}%
              </div>
              <p className="text-[11px] font-bold text-white/60 italic">{t('workflow_monitor.overall_rate')}</p>
            </div>

            <div className="space-y-4 px-6">
               <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between group hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                     <CheckCircle2 size={16} className="text-emerald-400" />
                     <span className="text-[11px] font-black text-white/50 uppercase tracking-widest">{t('workflow_monitor.approved')}</span>
                  </div>
                  <span className="text-lg font-black text-white">{Math.round(statistics.completedInstances * statistics.approvalRate)}</span>
               </div>
               
               <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between group hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                     <XCircle size={16} className="text-rose-400" />
                     <span className="text-[11px] font-black text-white/50 uppercase tracking-widest">{t('workflow_monitor.rejected')}</span>
                  </div>
                  <span className="text-lg font-black text-white">{Math.round(statistics.completedInstances * statistics.rejectionRate)}</span>
               </div>
            </div>
            
            <div className="pt-4 text-center">
               <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-inner">
                  System Health: Optimized
               </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
