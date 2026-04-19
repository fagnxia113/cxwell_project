import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Layers, 
  Tag, 
  Database 
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Accessory } from '../../../hooks/useAccessoryDetail';

interface AccessoryProfileCardProps {
  accessory: Accessory;
}

export default function AccessoryProfileCard({ accessory }: AccessoryProfileCardProps) {
  const { t } = useTranslation();

  return (
    <div className="premium-card p-10 bg-white border-none shadow-sm relative overflow-hidden rounded-[40px] animate-in fade-in duration-700">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none scale-150 rotate-12">
        <Layers size={140} />
      </div>
      
      <div className="flex flex-wrap items-end gap-10 relative z-10">
        <div className={cn(
           "w-28 h-28 rounded-[38px] flex items-center justify-center text-4xl font-black text-white shadow-2xl transition-transform hover:scale-105 duration-500",
           accessory.category === 'instrument' ? 'bg-indigo-600 shadow-indigo-600/20' : 'bg-slate-900 shadow-slate-900/20'
        )}>
          {accessory.accessory_name?.charAt(0) || 'A'}
        </div>
        
        <div className="flex-1 min-w-[300px] space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">{accessory.accessory_name}</h1>
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ring-4",
              accessory.health_status === 'normal' 
                ? 'bg-emerald-50 text-emerald-600 ring-emerald-500/5' 
                : 'bg-rose-50 text-rose-600 ring-rose-500/5'
            )}>
              <div className={cn("w-1.5 h-1.5 rounded-full", accessory.health_status === 'normal' ? 'bg-emerald-500' : 'bg-rose-500')} />
              {t(`equipment.health.${accessory.health_status}`)}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2.5 text-slate-400 font-black text-[10px] uppercase tracking-widest">
              <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner">
                <Tag size={12} className="text-indigo-500" />
              </div>
              {accessory.model_no || 'Standard Model'}
            </div>
            <div className="flex items-center gap-2.5 text-slate-400 font-black text-[10px] uppercase tracking-widest font-mono">
              <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner">
                <Database size={12} className="text-blue-500" />
              </div>
              {accessory.manage_code || 'UNCODED-ARCH'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
