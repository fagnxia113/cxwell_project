import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  MousePointer2 
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { FormField, FormLayout } from '../../../types/workflow';

interface DesignerCanvasProps {
  fields: FormField[];
  layoutType: FormLayout['type'];
  layoutColumns: number;
  selectedFieldIndex: number | null;
  onSelectField: (index: number) => void;
}

const FieldPlaceholder = ({ field, isSelected }: { field: FormField, isSelected: boolean }) => {
  const { t } = useTranslation();
  
  return (
    <div className={cn(
      "w-full px-5 py-4 bg-white/50 border-2 border-dashed rounded-[20px] transition-all group-hover:bg-white min-h-[100px] flex flex-col justify-center",
      isSelected ? "border-indigo-500 bg-white shadow-xl shadow-indigo-500/10" : "border-slate-100 hover:border-indigo-200"
    )}>
      <div className="flex items-center justify-between mb-3">
         <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              field.required ? "bg-rose-500" : "bg-slate-300"
            )} />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{field.label} {field.required && '*'}</span>
         </div>
         <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">Type: {field.type}</span>
      </div>
      
      <div className="h-10 bg-slate-50/50 rounded-xl border border-slate-100/50 flex items-center px-4">
        <span className="text-xs text-slate-300 italic">
          {field.placeholder || 'Simulation data sequence...'}
        </span>
      </div>
    </div>
  );
};

export default function DesignerCanvas({
  fields,
  layoutType,
  layoutColumns,
  selectedFieldIndex,
  onSelectField
}: DesignerCanvasProps) {
  const { t } = useTranslation();

  return (
    <div className="flex-1 bg-mesh p-12 overflow-y-auto custom-scrollbar flex flex-col items-center">
      
      {/* Viewport Control */}
      <div className="bg-white/60 backdrop-blur-xl px-6 py-2.5 rounded-full border border-white shadow-xl shadow-slate-900/5 flex items-center gap-6 mb-12 animate-in slide-in-from-top-4 duration-700">
         <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest">
            <MousePointer2 size={12} strokeWidth={3} />
            Edit Mode
         </div>
         <div className="w-px h-4 bg-slate-200" />
         <div className="flex gap-4 text-slate-400">
            <Monitor size={16} className="hover:text-slate-900 cursor-pointer transition-colors" />
            <Tablet size={16} className="hover:text-slate-900 cursor-pointer transition-colors" />
            <Smartphone size={16} className="hover:text-slate-900 cursor-pointer transition-colors" />
         </div>
      </div>

      {/* Main Drafting Canvas */}
      <div className="w-full max-w-5xl bg-white/40 backdrop-blur-sm rounded-[56px] border border-white p-12 shadow-2xl shadow-indigo-500/5 ring-1 ring-slate-100/10">
        
        {/* Layout Headers for Tabs/Steps */}
        {layoutType !== 'single' && (
          <div className="flex gap-6 mb-12 border-b border-slate-100 px-4">
             <div className="px-6 py-4 border-b-2 border-indigo-600">
                <span className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em]">{layoutType === 'tabs' ? 'Active Tab' : 'Step 01'}</span>
             </div>
             <div className="px-6 py-4 opacity-20 grayscale pointer-events-none">
                <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{layoutType === 'tabs' ? 'Tab 02' : 'Step 02'}</span>
             </div>
          </div>
        )}

        {/* Dynamic Grid */}
        <div className={cn(
          "grid gap-8",
          layoutColumns === 1 ? "grid-cols-1" : 
          layoutColumns === 2 ? "grid-cols-2" : "grid-cols-3"
        )}>
          {fields.map((field, index) => (
            <div
              key={index}
              onClick={() => onSelectField(index)}
              className={cn(
                "group cursor-pointer transition-all duration-500",
                field.layout?.width === 'full' ? "col-span-full" : 
                field.layout?.width === 'third' ? "col-span-1" : "col-span-1"
              )}
            >
              <FieldPlaceholder 
                field={field} 
                isSelected={selectedFieldIndex === index} 
              />
            </div>
          ))}

          {fields.length === 0 && (
            <div className="col-span-full py-32 flex flex-col items-center justify-center text-center">
               <div className="w-32 h-32 bg-white/50 rounded-full flex items-center justify-center mb-8 border-2 border-dashed border-slate-100 animate-pulse">
                  <Layout size={48} className="text-slate-200" />
               </div>
               <h3 className="text-xl font-black text-slate-300 uppercase tracking-[0.3em]">Canvas Empty</h3>
               <p className="text-[10px] text-slate-400 font-bold mt-4 uppercase tracking-[0.2em]">Start by adding structural nodes from the sidebar</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Metadata Legend */}
      <div className="mt-12 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] flex items-center gap-8">
         <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            Standard
         </div>
         <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Required
         </div>
         <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Selected
         </div>
      </div>
    </div>
  );
}

const Layout = ({ size, className }: { size: number, className: string }) => (
   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
      <line x1="3" x2="21" y1="9" y2="9"/>
      <line x1="9" x2="9" y1="21" y2="9"/>
   </svg>
);
