import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Layers, 
  Clock, 
  ShieldCheck, 
  TrendingUp 
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: any;
  color: 'blue' | 'emerald' | 'amber' | 'indigo';
  delay: number;
}

const StatCard = ({ title, value, icon: Icon, color, delay }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, type: 'spring', damping: 25 }}
    className="premium-card p-5 relative overflow-hidden group border-none bg-white shadow-sm hover:shadow-xl transition-all duration-500"
  >
    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
      <Icon size={64} />
    </div>
    
    <div className="flex items-center gap-4 relative z-10">
      <div className={cn(
        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ring-4 ring-white/50",
        color === 'blue' ? 'bg-blue-50 text-blue-600' :
        color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
        color === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
      )}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{title}</p>
        <h3 className="text-2xl font-black text-slate-900 leading-none tracking-tight">{value}</h3>
      </div>
    </div>
  </motion.div>
);

interface ApprovalStatsOverviewProps {
  stats: {
    total: number;
    pending: number;
    approved: number;
    efficiency: string;
  };
}

export default function ApprovalStatsOverview({ stats }: ApprovalStatsOverviewProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard 
        title={t('workflow.stats.total_requests')} 
        value={stats.total} 
        icon={Layers} 
        color="blue" 
        delay={0.1} 
      />
      <StatCard 
        title={t('workflow.status.normal')} 
        value={stats.pending} 
        icon={Clock} 
        color="amber" 
        delay={0.2} 
      />
      <StatCard 
        title={t('workflow.status.success')} 
        value={stats.approved} 
        icon={ShieldCheck} 
        color="emerald" 
        delay={0.3} 
      />
      <StatCard 
        title={t('workflow.stats.completion_rate')} 
        value={stats.efficiency} 
        icon={TrendingUp} 
        color="indigo" 
        delay={0.4} 
      />
    </div>
  );
}
