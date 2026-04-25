import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
        color="emerald"
        delay={0.1}
      />
      <StatCard
        icon={Activity}
        label={t('common.progress')}
        value={`${stats.avgProgress}%`}
        color="emerald"
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
  const colorConfig: Record<string, { bg: string; text: string; border: string }> = {
    emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-100' },
    blue: { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-100' },
    indigo: { bg: 'bg-indigo-500', text: 'text-indigo-600', border: 'border-indigo-100' },
    amber: { bg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-100' }
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
        <div className={cn(
          "p-4 rounded-2xl",
          config.bg
        )}>
          <Icon size={24} strokeWidth={2.5} className="text-white" />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1.5">{label}</p>
          <div className="flex items-baseline gap-1">
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{value}</h3>
            {subValue && <span className="text-xs text-slate-400">{subValue}</span>}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
