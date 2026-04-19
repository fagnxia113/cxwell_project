import React from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Clock, 
  Briefcase, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react'
import { cn } from '../../utils/cn'

interface StatusBadgeProps {
  status: string
  className?: string
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useTranslation()

  const configs: Record<string, { label: string; className: string; icon: any }> = {
    proposal: { 
      label: t('project.status.proposal'), 
      className: 'bg-slate-100 text-slate-500 border-slate-200', 
      icon: Clock 
    },
    initiated: { 
      label: t('project.status.initiated'), 
      className: 'bg-indigo-50 text-indigo-600 border-indigo-100', 
      icon: Briefcase 
    },
    in_progress: { 
      label: t('project.status.in_progress'), 
      className: 'bg-blue-50 text-blue-600 border-blue-100 shadow-sm shadow-blue-500/10', 
      icon: TrendingUp 
    },
    completed: { 
      label: t('project.status.completed'), 
      className: 'bg-emerald-50 text-emerald-600 border-emerald-100', 
      icon: CheckCircle2 
    },
    paused: { 
      label: t('project.status.paused'), 
      className: 'bg-amber-50 text-amber-600 border-amber-100', 
      icon: AlertCircle 
    },
    delayed: { 
      label: t('project.status.delayed'), 
      className: 'bg-rose-50 text-rose-600 border-rose-100', 
      icon: AlertCircle 
    }
  }

  const config = configs[status] || configs.proposal
  const Icon = config.icon

  return (
    <span className={cn(
      "px-2.5 py-1 rounded-full text-[10px] font-black border flex items-center gap-1.5 w-fit uppercase tracking-widest transition-all",
      config.className,
      className
    )}>
      <Icon size={12} />
      {config.label}
    </span>
  )
}
