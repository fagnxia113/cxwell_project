import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  X, 
  Play, 
  Terminal, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { FormField, FormLayout } from '../../../types/workflow';

interface DesignerPreviewOverlayProps {
  fields: FormField[];
  layoutType: FormLayout['type'];
  layoutColumns: number;
  previewData: Record<string, any>;
  setPreviewData: (data: Record<string, any>) => void;
  onClose: () => void;
}

export default function DesignerPreviewOverlay({
  fields,
  layoutType,
  layoutColumns,
  previewData,
  setPreviewData,
  onClose
}: DesignerPreviewOverlayProps) {
  const { t } = useTranslation();

  const handleValueChange = (name: string, value: any) => {
    setPreviewData({ ...previewData, [name]: value });
  };

  const renderField = (field: FormField) => {
    const value = previewData[field.name];
    const commonClass = "w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-400 transition-all outline-none placeholder:text-slate-300";

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleValueChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={field.rows || 4}
            className={cn(commonClass, "resize-none")}
          />
        );
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleValueChange(field.name, e.target.value)}
            className={commonClass}
          >
            <option value="">{t('form_designer_page.please_select')}</option>
            {field.options?.map((opt, i) => (
               <option key={i} value={typeof opt === 'object' ? opt.value : opt}>
                  {typeof opt === 'object' ? opt.label : opt}
               </option>
            ))}
          </select>
        );
      case 'radio':
        return (
          <div className="flex flex-wrap gap-4 pt-2">
            {field.options?.map((opt, i) => {
               const val = typeof opt === 'object' ? opt.value : opt;
               const label = typeof opt === 'object' ? opt.label : opt;
               const isChecked = value === val;
               return (
                  <button
                    key={i}
                    onClick={() => handleValueChange(field.name, val)}
                    className={cn(
                      "px-5 py-2.5 rounded-xl border text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                      isChecked ? "bg-indigo-600 border-indigo-600 text-white shadow-lg" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                    )}
                  >
                    <div className={cn("w-3 h-3 rounded-full border-2", isChecked ? "bg-white border-white" : "border-slate-200")} />
                    {label}
                  </button>
               );
            })}
          </div>
        );
      case 'checkbox':
        return (
          <button
            onClick={() => handleValueChange(field.name, !value)}
            className={cn(
              "inline-flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all",
              value ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-slate-50 border-slate-100 text-slate-400"
            )}
          >
            <div className={cn(
              "w-5 h-5 rounded-lg flex items-center justify-center transition-all",
              value ? "bg-indigo-600 text-white" : "bg-white border border-slate-200"
            )}>
              {value && <CheckCircle2 size={14} strokeWidth={3} />}
            </div>
            <span className="text-sm font-black uppercase tracking-tight">{field.label} Check</span>
          </button>
        );
      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => handleValueChange(field.name, e.target.value)}
            className={commonClass}
          />
        );
      default:
        return (
          <input
            type={field.type === 'number' ? 'number' : 'text'}
            value={value || ''}
            onChange={(e) => handleValueChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className={commonClass}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-3xl z-[100] flex flex-col p-4 lg:p-12 animate-in fade-in duration-500">
      <div className="max-w-6xl w-full mx-auto flex flex-col h-full bg-white rounded-[64px] shadow-2xl overflow-hidden border border-white/20">
        
        {/* Simulation Header */}
        <div className="px-12 py-12 flex justify-between items-start bg-slate-50/50 border-b border-slate-100 shrink-0">
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="px-4 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-indigo-500/20">
                    <Play size={10} fill="currentColor" />
                    Live Simulation
                 </div>
                 <div className="px-4 py-1.5 bg-white border border-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Environment: Runtime Alpha
                 </div>
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase">Interactive Preview</h1>
           </div>
           
           <button 
            onClick={onClose}
            className="w-14 h-14 bg-white shadow-xl shadow-slate-900/5 rounded-[22px] flex items-center justify-center border border-slate-100 hover:bg-rose-50 hover:border-rose-100 transition-all text-slate-300 hover:text-rose-500 active:scale-95"
           >
              <X size={28} />
           </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
           {/* Main Form Simulation */}
           <div className="flex-1 p-12 overflow-y-auto custom-scrollbar bg-white">
              <div className={cn(
                "grid gap-10",
                layoutColumns === 1 ? "grid-cols-1" : 
                layoutColumns === 2 ? "grid-cols-2" : "grid-cols-3"
              )}>
                {fields.map((field, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      "space-y-3",
                      field.layout?.width === 'full' ? "col-span-full" : 
                      field.layout?.width === 'third' ? "col-span-1" : "col-span-1"
                    )}
                  >
                    <label className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 pl-1">
                       {field.label}
                       {field.required && <div className="w-1 h-1 rounded-full bg-rose-500" />}
                    </label>
                    {renderField(field)}
                  </div>
                ))}
                
                {fields.length === 0 && (
                   <div className="col-span-full py-40 text-center space-y-4 opacity-30">
                      <Info size={48} className="mx-auto text-slate-300" />
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400 italic">No nodes available for simulation</p>
                   </div>
                )}
              </div>
           </div>

           {/* Real-time Data Output (Sidebar) */}
           <div className="w-[320px] bg-slate-900 flex flex-col">
              <div className="p-8 border-b border-white/5 flex items-center gap-3">
                 <Terminal size={18} className="text-emerald-400" />
                 <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Data Stream (IO)</span>
              </div>
              <div className="flex-1 p-8 overflow-y-auto custom-scrollbar font-mono text-[11px]">
                 <pre className="text-emerald-500/80 leading-relaxed">
                    {JSON.stringify(previewData, null, 2)}
                 </pre>
                 <div className="mt-8 text-slate-600 uppercase text-[9px] font-black tracking-widest">
                    Last activity: {new Date().toLocaleTimeString()}
                 </div>
              </div>
           </div>
        </div>

        <div className="px-12 py-8 bg-slate-50/50 border-t border-slate-100 flex justify-end shrink-0">
           <button 
             onClick={onClose}
             className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 hover:bg-black transition-all active:scale-95"
           >
              Terminate Session
           </button>
        </div>
      </div>
    </div>
  );
}
