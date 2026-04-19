import React from 'react'
import { motion } from 'framer-motion'
import { 
  Target, 
  CheckCircle2, 
  Activity, 
  Globe2 
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface ProjectStatsHeaderProps {
  stats: {
    totalCount: number
    activeCount: number
    completedCount: number
    avgProgress: number
    geographyCount: number
  }
}

export default function ProjectStatsHeader({ stats }: ProjectStatsHeaderProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard 
        icon={Target} 
        label={t('project.stats.active')} 
        value={stats.activeCount} 
        subValue={`/ ${stats.totalCount}`}
        color="emerald"
        delay={0}
      />
      <StatCard 
        icon={CheckCircle2} 
        label={t('project.stats.completed')} 
        value={stats.completedCount} 
        color="blue"
        delay={0.1}
      />
      <StatCard 
        icon={Activity} 
        label={t('common.progress')} 
        value={`${stats.avgProgress}%`} 
        color="indigo"
        delay={0.2}
      />
      <StatCard 
        icon={Globe2} 
        label={t('project.stats.geographies')} 
        value={stats.geographyCount} 
        color="amber"
        delay={0.3}
      />
    </div>
  )
}

function StatCard({ icon: Icon, label, value, subValue, color, delay }: any) {
  const colorConfig: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600 hover:border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 hover:border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-600 hover:border-indigo-100',
    amber: 'bg-amber-50 text-amber-600 hover:border-amber-100'
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay }}
      className={`bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 group transition-all ${colorConfig[color]}`}
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform ${colorConfig[color].split(' ')[0]} ${colorConfig[color].split(' ')[1]}`}>
        <Icon size={20} />
      </div>
      <div className="space-y-0.5">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-black text-slate-900 tabular-nums tracking-tighter">{value}</span>
          {subValue && <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{subValue}</span>}
        </div>
      </div>
    </motion.div>
  )
}
