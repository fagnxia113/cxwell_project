import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Clock, PlayCircle, AlertCircle } from 'lucide-react'
import { Project, Milestone } from '../../types/project'
import { cn } from '../../utils/cn'
import { useTranslation } from 'react-i18next'

interface MilestoneTimelineProps {
  milestones: Milestone[]
  projectStatus: string
}

export default function MilestoneTimeline({ milestones, projectStatus }: MilestoneTimelineProps) {
  const { t } = useTranslation()

  if (!milestones || milestones.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg border border-slate-100 flex items-center justify-center min-h-[160px]">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('common.noData')}</p>
      </div>
    )
  }

  // Sort milestones chronologically
  const sortedMilestones = [...milestones].sort((a, b) => 
    new Date(a.planned_end_date).getTime() - new Date(b.planned_end_date).getTime()
  )

  const getStatusConfig = (status: string, plannedEnd: string) => {
    const isOverdue = new Date(plannedEnd) < new Date() && status !== 'completed'
    if (status === 'completed') return { color: 'bg-emerald-500 text-emerald-500 border-emerald-200', icon: CheckCircle2, bgBg: 'bg-emerald-50' }
    if (isOverdue) return { color: 'bg-rose-500 text-rose-500 border-rose-200', icon: AlertCircle, bgBg: 'bg-rose-50' }
    if (status === 'in_progress') return { color: 'bg-blue-500 text-blue-500 border-blue-200', icon: PlayCircle, bgBg: 'bg-blue-50' }
    return { color: 'bg-slate-300 text-slate-400 border-slate-200', icon: Clock, bgBg: 'bg-slate-50' }
  }

  return (
    <div className="bg-white p-6 lg:p-8 rounded-xl border border-slate-100 shadow-sm overflow-x-auto custom-scrollbar">
      <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
        <span className="w-1.5 h-4 bg-blue-500 rounded-full" /> {t('project.milestone.timeline')}
      </h3>
      
      <div className="relative min-w-[600px] py-4">
        {/* The Base Connecting Line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 rounded-full overflow-hidden">
           {/* Filled Line for progress */}
           <div 
             className="h-full bg-emerald-500 transition-all duration-1000" 
             style={{ width: `${Math.max(0, (sortedMilestones.filter(m => m.status === 'completed').length / sortedMilestones.length) * 100)}%` }}
           />
        </div>

        <div className="relative flex justify-between w-full">
          {sortedMilestones.map((milestone, idx) => {
            const config = getStatusConfig(milestone.status, milestone.planned_end_date)
            const Icon = config.icon

            return (
              <motion.div 
                key={milestone.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex flex-col items-center relative group w-24"
              >
                {/* Node Status Label (Top) */}
                <div className="absolute bottom-full mb-4 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                  <div className="bg-slate-900 text-white text-[10px] uppercase font-bold py-1 px-3 rounded shadow-xl">
                    {t(`project.status.${milestone.status}`)}
                  </div>
                </div>

                {/* Date (Top offset) */}
                <span className="text-[9px] font-black text-slate-400 mb-3 tracking-widest uppercase transform translate-y-2">
                  {new Date(milestone.planned_end_date).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })}
                </span>

                {/* Timeline Circle */}
                <div className={cn(
                  "w-8 h-8 rounded-full border-4 flex items-center justify-center relative z-10 bg-white transition-transform group-hover:scale-125 duration-300 shadow-sm",
                  config.color
                )}>
                  <Icon size={12} className={milestone.status === 'pending' && new Date(milestone.planned_end_date) >= new Date() ? "text-slate-300" : ""} />
                </div>

                {/* Milestone Name (Bottom) */}
                <div className="mt-4 text-center">
                  <p className="text-[10px] font-black text-slate-900 leading-tight uppercase group-hover:text-blue-600 transition-colors line-clamp-2 title-tooltip" title={milestone.name}>
                    {milestone.name}
                  </p>
                  {milestone.progress > 0 && milestone.progress < 100 && (
                    <span className="text-[9px] font-bold text-slate-400 mt-1 block">{milestone.progress}%</span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
