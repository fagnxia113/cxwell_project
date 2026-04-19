import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ShieldCheck, 
  Zap, 
  MapPin, 
  User 
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Equipment } from '../../../hooks/useEquipmentDetail';

interface EquipmentStatusBoardProps {
  equipment: Equipment;
}

const StatusMetric = ({ label, value, icon: Icon, color }: any) => {
  const colorMap: any = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100 ring-emerald-500/10",
    amber: "bg-amber-50 text-amber-600 border-amber-100 ring-amber-500/10",
    rose: "bg-rose-50 text-rose-600 border-rose-100 ring-rose-500/10",
    blue: "bg-blue-50 text-blue-600 border-blue-100 ring-blue-500/10",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100 ring-indigo-500/10",
    slate: "bg-slate-50 text-slate-400 border-slate-100 ring-slate-500/10"
  };
  
  return (
    <div className={cn(
      "p-5 rounded-[24px] border flex items-center gap-5 transition-all hover:shadow-lg hover:-translate-y-1 duration-300 ring-4", 
      colorMap[color]
    )}>
      <div className="p-3 bg-white rounded-2xl shadow-sm border border-inherit">
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5">{label}</p>
        <p className="text-base font-black tracking-tight leading-none">{value}</p>
      </div>
    </div>
  );
};

export default function EquipmentStatusBoard({ equipment }: EquipmentStatusBoardProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatusMetric 
          label={t('equipment.fields.health')} 
          value={t(`equipment.health.${equipment.health_status}`)} 
          icon={ShieldCheck} 
          color={equipment.health_status === 'normal' ? 'emerald' : 'rose'} 
        />
        <StatusMetric 
          label={t('sidebar.status')} 
          value={t(`equipment.location_status.${equipment.usage_status === 'idle' ? 'idle' : 'in_project'}`)} 
          icon={Zap} 
          color={equipment.usage_status === 'idle' ? 'slate' : 'blue'} 
        />
        <div className="col-span-full">
          <StatusMetric 
            label={t('equipment.fields.location')} 
            value={equipment.location_name || t('equipment.location_status.warehouse')} 
            icon={MapPin} 
            color={equipment.location_status === 'warehouse' ? 'indigo' : 'emerald'} 
          />
        </div>
      </div>

      {/* Keeper Card */}
      <div className="premium-card p-8 bg-slate-900 border-none relative group overflow-hidden shadow-2xl shadow-indigo-900/10 rounded-[32px] hover:shadow-indigo-500/20 transition-all duration-500">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 blur-[60px] -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 rounded-[20px] bg-white/10 border border-white/10 flex items-center justify-center text-indigo-400 backdrop-blur-md shadow-xl">
            <User size={32} strokeWidth={2.5} />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1.5">{t('equipment.fields.keeper')}</p>
            <h3 className="text-2xl font-black text-white tracking-tight leading-none">{equipment.keeper_name || t('common.not_specified')}</h3>
            <p className="text-[9px] font-bold text-slate-500 mt-2 uppercase tracking-widest flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
               ID: {equipment.keeper_id || '---'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
