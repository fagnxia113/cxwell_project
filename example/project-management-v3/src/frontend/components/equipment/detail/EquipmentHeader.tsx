import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Trash2, 
  ArrowRightLeft, 
  Edit3, 
  Hash, 
  Shield, 
  Globe 
} from 'lucide-react';
import { Equipment } from '../../../hooks/useEquipmentDetail';

interface EquipmentHeaderProps {
  equipment: Equipment;
  isAdmin: boolean;
  onDelete: () => void;
}

export default function EquipmentHeader({ equipment, isAdmin, onDelete }: EquipmentHeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-start gap-4">
        <button 
          onClick={() => navigate('/equipment')} 
          className="w-10 h-10 shrink-0 bg-white hover:bg-slate-50 rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all group"
        >
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        </button>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">{equipment.equipment_name}</h1>
            <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest italic shadow-lg shadow-slate-900/10">
              {equipment.manage_code}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <p className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest">
              <Hash size={12} className="text-indigo-500" /> {equipment.model_no}
            </p>
            <p className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest">
              <Shield size={12} className="text-blue-500" /> {equipment.brand || 'Global Asset'}
            </p>
            <p className="flex items-center gap-2 text-indigo-500 font-black text-[10px] uppercase tracking-widest leading-none">
              <Globe size={12} /> {equipment.manufacturer || 'Standard OEM'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {isAdmin && (
          <button 
            onClick={onDelete} 
            className="px-5 py-2.5 bg-white text-rose-600 rounded-xl shadow-sm border border-rose-100 hover:bg-rose-50 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
          >
            <Trash2 size={14} /> {t('common.delete')}
          </button>
        )}
        <button 
          onClick={() => navigate('/approvals/new')} 
          className="px-5 py-2.5 bg-white text-slate-600 rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
        >
          <ArrowRightLeft size={14} /> {t('equipment.transfer_mgmt')}
        </button>
        <button 
          onClick={() => navigate(`/equipment/form?id=${equipment.id}`)} 
          className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2 active:scale-95"
        >
          <Edit3 size={14} /> {t('common.edit')}
        </button>
      </div>
    </div>
  );
}
