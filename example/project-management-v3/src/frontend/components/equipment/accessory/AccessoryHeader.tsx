import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Save, 
  Activity, 
  X 
} from 'lucide-react';

interface AccessoryHeaderProps {
  isEditing: boolean;
  actionLoading: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onDelete: () => void;
}

export default function AccessoryHeader({
  isEditing,
  actionLoading,
  onEdit,
  onCancel,
  onSave,
  onDelete
}: AccessoryHeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between max-w-6xl mx-auto animate-in fade-in slide-in-from-top-4 duration-500">
      <button 
        onClick={() => navigate('/equipment/accessories')} 
        className="flex items-center gap-3 px-5 py-2.5 bg-white text-slate-600 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all font-black text-[10px] uppercase tracking-widest shadow-sm group active:scale-95"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span>{t('common.back')}</span>
      </button>
      
      <div className="flex items-center gap-3">
        {!isEditing ? (
          <>
            <button 
              onClick={onEdit} 
              className="flex items-center gap-2.5 px-6 py-2.5 bg-white text-slate-600 rounded-2xl border border-slate-200 hover:text-indigo-600 hover:border-indigo-100 transition-all font-black text-[10px] uppercase tracking-widest shadow-sm active:scale-95"
            >
              <Edit3 size={16} />
              <span>{t('common.edit')}</span>
            </button>
            <button 
              onClick={onDelete} 
              className="flex items-center justify-center w-11 h-11 bg-white text-slate-300 rounded-2xl border border-slate-200 hover:text-rose-600 hover:border-rose-100 transition-all shadow-sm active:scale-95"
            >
              <Trash2 size={18} />
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={onCancel} 
              className="px-6 py-2.5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-all"
            >
              {t('common.cancel')}
            </button>
            <button 
              onClick={onSave} 
              disabled={actionLoading} 
              className="flex items-center gap-2.5 px-8 py-2.5 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-500/20 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-30"
            >
              {actionLoading ? <Activity className="animate-spin" size={16} /> : <Save size={16} />}
              <span>{t('common.save')}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
