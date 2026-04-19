import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface ProgressBarProps {
  label: string;
  progress: number;
  icon?: LucideIcon;
  colorClass?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  label, 
  progress, 
  icon: Icon, 
  colorClass = 'blue' 
}) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500',
    indigo: 'bg-indigo-600',
    emerald: 'bg-emerald-500',
    rose: 'bg-rose-500',
    amber: 'bg-amber-500',
  };

  const bgColor = colors[colorClass] || colors.blue;

  return (
    <div className="space-y-3 w-full animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className={`p-1.5 rounded-lg bg-opacity-10 ${bgColor === 'bg-indigo-600' ? 'bg-indigo-100 text-indigo-600' : bgColor.replace('bg-', 'bg-') + '/10 ' + bgColor.replace('bg-', 'text-')}`}>
               <Icon size={14} />
            </div>
          )}
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{label}</span>
        </div>
        <div className="flex items-baseline gap-0.5">
          <span className="text-lg font-black text-slate-900 leading-none">{progress}</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">%</span>
        </div>
      </div>
      
      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-slate-50/50">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className={clsx("h-full rounded-full relative shadow-sm", bgColor)}
        >
          {/* Subtle Shimmer Overlay */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ 
              x: ['-100%', '100%']
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2.5, 
              ease: "linear" 
            }}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default ProgressBar;
