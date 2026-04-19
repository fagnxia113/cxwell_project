import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  MapPin, 
  ShieldCheck, 
  ChevronRight, 
  Unlink, 
  Plus, 
  Clock,
  Link as LinkIcon
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Accessory } from '../../../hooks/useAccessoryDetail';

interface AccessoryConnectivitySidebarProps {
  accessory: Accessory;
  onBind: () => void;
  onUnbind: () => void;
}

export default function AccessoryConnectivitySidebar({
  accessory,
  onBind,
  onUnbind
}: AccessoryConnectivitySidebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
      {/* Live Hub Card */}
      <div className="premium-card p-8 bg-slate-900 text-white shadow-2xl shadow-indigo-900/20 rounded-[40px] border-none relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 blur-[60px] -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
        
        <h2 className="text-xs font-black tracking-[0.2em] flex items-center gap-3 uppercase text-slate-500 mb-8 relative z-10">
          <Activity size={18} className="text-indigo-400" />
          Telematic Hub
        </h2>
        
        <div className="space-y-8 relative z-10">
          <div className="space-y-3">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none block">{t('equipment.fields.location')}</span>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400 backdrop-blur-md border border-white/5 shadow-xl">
                <MapPin size={24} strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <p className="font-black text-xl tracking-tight leading-none truncate">{accessory.location_name || t('equipment.location_status.warehouse')}</p>
                <div className="flex items-center gap-1.5 mt-2">
                   <div className="w-1 h-1 rounded-full bg-indigo-400" />
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t(`equipment.location_status.${accessory.location_status}`)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-white/5" />

          <div className="space-y-3">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none block">{t('equipment.fields.status')}</span>
             <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
               <span className="text-xs font-black uppercase tracking-[0.1em]">{t(`equipment.location_status.${accessory.usage_status === 'in_use' ? 'in_project' : 'idle'}`)}</span>
               <div className={cn(
                 "w-2.5 h-2.5 rounded-full ring-4 shadow-[0_0_15px_rgba(99,102,241,0.5)]", 
                 accessory.usage_status === 'in_use' ? 'bg-indigo-500 ring-indigo-500/20' : 'bg-slate-700 ring-slate-700/20'
               )} />
             </div>
          </div>
        </div>
      </div>

      {/* Connectivity Management */}
      <div className="premium-card p-8 bg-white border-none shadow-sm rounded-[40px] group transition-all hover:shadow-xl duration-500">
        <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-6">
           <h2 className="text-[10px] font-black text-slate-900 flex items-center gap-2 uppercase tracking-[0.2em]">
            <LinkIcon size={16} className="text-indigo-500 group-hover:rotate-45 transition-transform duration-700" />
            Connectivity
          </h2>
        </div>

        {accessory.host_equipment_id ? (
          <div className="space-y-6">
             <div 
               onClick={() => navigate(`/equipment/${accessory.host_equipment_id}`)} 
               className="p-5 bg-indigo-50/50 hover:bg-indigo-600 rounded-[28px] border border-indigo-100/50 flex items-center gap-5 group/host cursor-pointer transition-all duration-500 shadow-sm hover:shadow-xl hover:shadow-indigo-500/20"
             >
                <div className="w-12 h-12 bg-indigo-600 group-hover/host:bg-white text-white group-hover/host:text-indigo-600 rounded-2xl flex items-center justify-center transition-colors shadow-lg shadow-indigo-500/20">
                  <ShieldCheck size={24} strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-black text-indigo-400 group-hover/host:text-white/60 uppercase tracking-widest block leading-none mb-1.5">{t('sidebar.host_matrix')}</span>
                  <p className="font-black text-slate-900 group-hover/host:text-white truncate tracking-tight text-base">{accessory.host_equipment_name}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-indigo-300 group-hover/host:text-white group-hover/host:translate-x-1 transition-all">
                   <ChevronRight size={18} strokeWidth={3} />
                </div>
             </div>
             
             <button 
               onClick={onUnbind} 
               className="w-full py-4 text-rose-500 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-50 rounded-2xl transition-all border-2 border-transparent hover:border-rose-100 group/unbind active:scale-95"
             >
               <Unlink size={16} className="group-hover:rotate-12 transition-transform" />
               {t('equipment.action.unbind')}
             </button>
          </div>
        ) : (
          <div className="space-y-6">
             <div className="py-12 flex flex-col items-center text-center px-6 bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-100 grayscale opacity-40">
                <div className="p-4 bg-white rounded-2xl shadow-inner mb-4">
                   <Unlink className="text-slate-300" size={32} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] leading-relaxed">
                  Standalone Asset <br/> Decentralized
                </p>
             </div>
             <button 
               onClick={onBind} 
               className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:shadow-indigo-500/30 hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95"
             >
               <Plus size={16} strokeWidth={4} />
               {t('equipment.action.bind')}
             </button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-8 flex items-center justify-between text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] opacity-60">
         <div className="flex items-center gap-2">
            <Clock size={12} /> 
            {accessory.created_at ? new Date(accessory.created_at).toLocaleDateString() : 'Pending'}
         </div>
         <div className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-slate-200" />
            V1.2.0
         </div>
      </div>
    </div>
  );
}
