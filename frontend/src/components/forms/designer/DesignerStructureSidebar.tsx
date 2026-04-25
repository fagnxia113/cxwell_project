import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Settings2,
  ListTree,
  Columns
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { FormField, FormLayout } from '../../../types/workflow';

interface DesignerStructureSidebarProps {
  layoutType: FormLayout['type'];
  setLayoutType: (type: FormLayout['type']) => void;
  layoutColumns: number;
  setLayoutColumns: (cols: number) => void;
  fields: FormField[];
  selectedFieldIndex: number | null;
  onSelectField: (index: number) => void;
  onAddField: () => void;
  onMoveField: (index: number, direction: 'up' | 'down') => void;
  onDeleteField: (index: number) => void;
}

export default function DesignerStructureSidebar({
  layoutType,
  setLayoutType,
  layoutColumns,
  setLayoutColumns,
  fields,
  selectedFieldIndex,
  onSelectField,
  onAddField,
  onMoveField,
  onDeleteField
}: DesignerStructureSidebarProps) {
  const { t } = useTranslation();

  return (
    <div className="w-80 bg-slate-50 border-r border-slate-200 overflow-y-auto custom-scrollbar flex flex-col">
      {/* Global Config Section */}
      <div className="p-6 border-b border-slate-200 bg-white space-y-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
          <Settings2 size={14} className="text-indigo-500" />
          {t('form_designer_page.layout_settings')}
        </h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none block ml-1">{t('form_designer_page.layout_type')}</label>
            <select
              value={layoutType}
              onChange={(e) => setLayoutType(e.target.value as any)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all outline-none"
            >
              <option value="single">{t('form_designer_page.layout_single')}</option>
              <option value="tabs">{t('form_designer_page.layout_tabs')}</option>
              <option value="steps">{t('form_designer_page.layout_steps')}</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none block ml-1">{t('form_designer_page.columns_label')}</label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map(cols => (
                <button
                  key={cols}
                  onClick={() => setLayoutColumns(cols)}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-xl border transition-all gap-1.5",
                    layoutColumns === cols 
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
                      : "bg-white border-slate-100 text-slate-400 hover:border-indigo-200"
                  )}
                >
                  <Columns size={12} strokeWidth={3} />
                  <span className="text-[10px] font-black">{cols} 列</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Field List Section */}
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <ListTree size={14} className="text-indigo-500" />
            {t('form_designer_page.field_list')}
          </h3>
          <button
            onClick={onAddField}
            className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
            title="添加节点"
          >
            <Plus size={16} strokeWidth={3} />
          </button>
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={index}
              onClick={() => onSelectField(index)}
              className={cn(
                "p-4 rounded-2xl border cursor-pointer transition-all group relative overflow-hidden",
                selectedFieldIndex === index
                  ? "border-indigo-500 bg-white shadow-xl shadow-indigo-500/5 ring-4 ring-indigo-500/5"
                  : "border-slate-100 bg-white/50 hover:bg-white hover:border-indigo-200"
              )}
            >
              <div className="flex items-center justify-between relative z-10">
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "font-black text-sm tracking-tight truncate uppercase leading-tight",
                    selectedFieldIndex === index ? "text-indigo-600" : "text-slate-700"
                  )}>
                    {field.label}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 uppercase tracking-tighter text-[9px] font-black text-slate-400">
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500">{field.type}</span>
                    <span className="opacity-30">|</span>
                    <span className="truncate">{field.name}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <div className="flex flex-col gap-1">
                     <button
                        onClick={(e) => { e.stopPropagation(); onMoveField(index, 'up'); }}
                        disabled={index === 0}
                        className="p-1 hover:bg-indigo-50 text-slate-300 hover:text-indigo-600 rounded disabled:opacity-20"
                      >
                        <ChevronUp size={14} strokeWidth={3} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onMoveField(index, 'down'); }}
                        disabled={index === fields.length - 1}
                        className="p-1 hover:bg-indigo-50 text-slate-300 hover:text-indigo-600 rounded disabled:opacity-20"
                      >
                        <ChevronDown size={14} strokeWidth={3} />
                      </button>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteField(index); }}
                    className="p-2 text-slate-200 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <Trash2 size={14} strokeWidth={3} />
                  </button>
                </div>
              </div>
              
              {selectedFieldIndex === index && (
                 <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600" />
              )}
            </div>
          ))}

          {fields.length === 0 && (
            <div className="text-center py-16 px-6 bg-slate-100/30 rounded-[32px] border-2 border-dashed border-slate-200 grayscale opacity-40">
              <Plus className="mx-auto text-slate-300 mb-4" size={40} />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                初始状态 <br/> 尚无可用节点
              </p>
              <button
                onClick={onAddField}
                className="mt-6 text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline"
              >
                初始化架构
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
