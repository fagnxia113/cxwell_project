import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Edit2, 
  Activity,
  Layers
} from 'lucide-react';
import { cn } from '../../../utils/cn';

interface DesignerHeaderProps {
  templateName: string;
  setTemplateName: (name: string) => void;
  previewMode: boolean;
  setPreviewMode: (mode: boolean) => void;
  saving: boolean;
  onSave: () => void;
}

export default function DesignerHeader({
  templateName,
  setTemplateName,
  previewMode,
  setPreviewMode,
  saving,
  onSave
}: DesignerHeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="bg-white border-b border-slate-100 px-6 py-4 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center justify-between max-w-[1920px] mx-auto">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate('/forms/templates')}
            className="p-2.5 hover:bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 group focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all">
            <Layers size={18} className="text-indigo-500" />
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder={t('form_designer_page.template_name_placeholder')}
              className="text-sm font-black text-slate-900 bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-slate-300 w-64 uppercase tracking-tight"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
             <button
               onClick={() => setPreviewMode(false)}
               className={cn(
                 "px-5 py-2 rounded-xl flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest transition-all",
                 !previewMode ? "bg-white text-indigo-600 shadow-md ring-1 ring-slate-100" : "text-slate-400 hover:text-slate-600"
               )}
             >
               <Edit2 size={12} strokeWidth={3} />
               Design
             </button>
             <button
               onClick={() => setPreviewMode(true)}
               className={cn(
                 "px-5 py-2 rounded-xl flex items-center gap-2.5 text-[10px] font-black uppercase tracking-widest transition-all",
                 previewMode ? "bg-white text-indigo-600 shadow-md ring-1 ring-slate-100" : "text-slate-400 hover:text-slate-600"
               )}
             >
               <Eye size={12} strokeWidth={3} />
               Simulation
             </button>
          </div>

          <div className="w-px h-6 bg-slate-100 mx-2" />

          <button
            onClick={onSave}
            disabled={saving}
            className="px-8 py-3 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-900/10 hover:bg-indigo-600 hover:shadow-indigo-500/20 transition-all flex items-center gap-3 font-black text-[10px] uppercase tracking-widest active:scale-95 disabled:opacity-30"
          >
            {saving ? <Activity className="animate-spin" size={14} /> : <Save size={14} strokeWidth={3} />}
            {saving ? t('form_designer_page.saving') : t('form_designer_page.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
