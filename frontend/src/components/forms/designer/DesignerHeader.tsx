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
    <div className="bg-white/80 backdrop-blur-xl px-4 py-3 sticky top-0 z-50 border-b border-slate-100 shadow-sm flex items-center justify-between">
      <div className="flex items-center gap-6">
        <button
          onClick={() => navigate('/forms/templates')}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 group focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <div className="p-1.5 bg-primary/10 rounded-md">
            <Layers size={14} className="text-primary" />
          </div>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder={t('form_designer_page.template_name_placeholder')}
            className="text-sm font-bold text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-slate-300 w-64"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex bg-slate-100 p-1 rounded-lg">
           <button
             onClick={() => setPreviewMode(false)}
             className={cn(
               "px-4 py-1.5 rounded-md flex items-center gap-2 text-xs font-bold transition-all",
               !previewMode ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
             )}
           >
             <Edit2 size={12} />
             编辑
           </button>
           <button
             onClick={() => setPreviewMode(true)}
             className={cn(
               "px-4 py-1.5 rounded-md flex items-center gap-2 text-xs font-bold transition-all",
               previewMode ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
             )}
           >
             <Eye size={12} />
             预览
           </button>
        </div>

        <button
          onClick={onSave}
          disabled={saving}
          className="px-6 py-2 bg-primary text-white rounded-lg shadow-sm hover:brightness-110 transition-all flex items-center gap-2 text-sm font-bold active:scale-95 disabled:opacity-50"
        >
          {saving ? <Activity className="animate-spin" size={14} /> : <Save size={14} />}
          {saving ? t('form_designer_page.saving') : t('form_designer_page.save')}
        </button>
      </div>
    </div>
  );
}
