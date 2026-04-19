import React from 'react'
import { 
  Globe2, 
  Briefcase, 
  Target, 
  Globe 
} from 'lucide-react'
import { cn } from '../../utils/cn'

interface ProjectTypeIconProps {
  type: string
  size?: number
  className?: string
}

export default function ProjectTypeIcon({ type, size = 16, className }: ProjectTypeIconProps) {
  const getIconConfig = (type: string) => {
    switch(type) {
      case 'foreign': 
        return { Icon: Globe2, colorClass: 'text-indigo-500' };
      case 'domestic': 
        return { Icon: Briefcase, colorClass: 'text-emerald-500' };
      case 'rd': 
        return { Icon: Target, colorClass: 'text-purple-500' };
      default: 
        return { Icon: Globe, colorClass: 'text-slate-400' };
    }
  }

  const { Icon, colorClass } = getIconConfig(type)

  return <Icon size={size} className={cn(colorClass, className)} />
}
