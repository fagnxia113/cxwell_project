import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  Layers, 
  Unlink 
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Accessory } from '../../../hooks/useEquipmentDetail';

interface AccessoryRegistryProps {
  accessories: Accessory[] | null;
  onBind: () => void;
  onUnbind: (accessory: Accessory) => void;
}

export default function AccessoryRegistry({
  accessories,
  onBind,
  onUnbind
}: AccessoryRegistryProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-3">
            <Layers className="text-indigo-600" size={24} /> 
            {t('sidebar.accessories')}
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-9 leading-none">Resource Chain Network</p>
        </div>
        <button 
          onClick={onBind} 
          className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-2 active:scale-95"
        >
          <PlusCircle size={16} strokeWidth={3} /> {t('equipment.action.bind')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accessories && accessories.length > 0 ? accessories.map((acc) => (
          <div 
            key={acc.id} 
            onClick={() => navigate(`/equipment/accessories/${acc.id}`)} 
            className="premium-card p-6 bg-white border border-slate-100 hover:border-indigo-500 transition-all rounded-[32px] shadow-sm hover:shadow-2xl group relative overflow-hidden cursor-pointer duration-500"
          >
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] scale-150 text-indigo-500 group-hover:scale-[2] group-hover:rotate-12 transition-transform duration-1000">
              <Layers size={80} />
            </div>
            
            <div className="flex flex-col h-full relative z-10 space-y-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-900 text-white rounded-lg text-[9px] font-black italic shadow-sm uppercase tracking-tighter">
                      {acc.manage_code || 'UNC-ID'}
                    </span>
                    <div className={cn(
                      "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ring-4",
                      acc.health_status === 'normal' 
                        ? 'bg-emerald-50 text-emerald-600 ring-emerald-500/10' 
                        : 'bg-rose-50 text-rose-600 ring-rose-500/10'
                    )}>
                      <div className={cn("w-1 h-1 rounded-full", acc.health_status === 'normal' ? 'bg-emerald-500' : 'bg-rose-500')} />
                      {t(`equipment.health.${acc.health_status}`)}
                    </div>
                  </div>
                  <h4 className="text-lg font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors uppercase leading-none">
                    {acc.accessory_name}
                  </h4>
                </div>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onUnbind(acc); 
                  }} 
                  className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 shadow-sm flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                  title={t('equipment.action.unbind')}
                >
                  <Unlink size={16} strokeWidth={2.5} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6 border-t border-slate-50 pt-5">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{t('equipment.fields.model')}</p>
                  <p className="text-[11px] font-bold text-slate-700 truncate tracking-tight">{acc.model_no || 'Standard'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{t('equipment.fields.quantity')}</p>
                  <p className="text-[11px] font-black text-slate-900 tracking-tighter">
                    {acc.quantity} <span className="text-[9px] text-slate-400 bg-slate-50 px-1 rounded ml-1 italic">{acc.unit}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-24 bg-white rounded-[40px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center opacity-40 grayscale items-center">
             <Layers size={48} className="mb-4 text-slate-300" />
             <p className="text-xs font-black uppercase tracking-[0.2em]">{t('equipment.empty.no_accessories')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
