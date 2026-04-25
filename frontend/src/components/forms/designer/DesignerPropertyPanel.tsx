import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Settings, 
  ShieldCheck, 
  Layout, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { FormField } from '../../../types/workflow';

interface DesignerPropertyPanelProps {
  field: FormField | null;
  onUpdate: (updates: Partial<FormField>) => void;
}

const FIELD_TYPES = [
  { value: 'text', label: '文本输入' },
  { value: 'number', label: '数字' },
  { value: 'currency', label: '金额' },
  { value: 'textarea', label: '多行文本' },
  { value: 'select', label: '选择器' },
  { value: 'date', label: '日期' },
  { value: 'checkbox', label: '复选框' },
  { value: 'radio', label: '单选框' },
  { value: 'user', label: '人员选择' },
  { value: 'department', label: '部门选择' },
  { value: 'file', label: '文件上传' },
  { value: 'phone', label: '电话' },
  { value: 'email', label: '邮箱' },
  { value: 'array', label: '表格/自增行' }
];

const PropertyLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none block mb-2 px-1">
    {children}
  </label>
);

const PropertyGrid = ({ title, icon: Icon, children }: any) => (
  <div className="space-y-4 pt-6 border-t border-slate-100 first:border-0 first:pt-0">
    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
      <Icon size={14} className="text-indigo-500" />
      {title}
    </h4>
    <div className="space-y-5 px-1">
      {children}
    </div>
  </div>
);

export default function DesignerPropertyPanel({
  field,
  onUpdate
}: DesignerPropertyPanelProps) {
  const { t } = useTranslation();

  if (!field) {
    return (
      <div className="w-[400px] border-l border-slate-200 bg-white p-12 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner ring-8 ring-slate-50/50">
          <Settings className="w-8 h-8 text-slate-200 animate-[spin_10s_linear_infinite]" />
        </div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
          属性矩阵 <br/> 空闲状态
        </p>
        <p className="text-[10px] text-slate-300 font-bold mt-4 uppercase tracking-widest">请选择一个实体进行配置</p>
      </div>
    );
  }

  return (
    <div className="w-[400px] border-l border-slate-200 bg-white overflow-y-auto custom-scrollbar p-8 animate-in slide-in-from-right duration-500">
      <div className="space-y-12 pb-20">
        
        {/* Basic Config */}
        <PropertyGrid title="操作逻辑" icon={Settings}>
          <div className="space-y-2">
            <PropertyLabel>{t('form_designer_page.field_name_label')}</PropertyLabel>
            <input
              type="text"
              value={field.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-200 transition-all outline-none"
            />
          </div>

          <div className="space-y-2">
            <PropertyLabel>{t('form_designer_page.field_label_label')}</PropertyLabel>
            <input
              type="text"
              value={field.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-200 transition-all outline-none"
            />
          </div>

          <div className="space-y-2">
            <PropertyLabel>{t('form_designer_page.field_type_label')}</PropertyLabel>
            <select
              value={field.type}
              onChange={(e) => onUpdate({ type: e.target.value as any })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white outline-none"
            >
              {FIELD_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </PropertyGrid>

        {/* Layout Config */}
        <PropertyGrid title="视觉架构" icon={Layout}>
          <div className="space-y-4">
            <div className="space-y-2">
              <PropertyLabel>{t('form_designer_page.field_width_label')}</PropertyLabel>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: 'full', l: '100%' },
                  { v: 'half', l: '50%' },
                  { v: 'third', l: '33%' }
                ].map(opt => (
                  <button
                    key={opt.v}
                    onClick={() => onUpdate({ layout: { ...field.layout, width: opt.v as any } })}
                    className={cn(
                      "py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                      field.layout?.width === opt.v 
                        ? "bg-slate-900 border-slate-900 text-white shadow-lg" 
                        : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                    )}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
               <PropertyLabel>{t('form_designer_page.placeholder_section')}</PropertyLabel>
               <input
                 type="text"
                 value={field.placeholder || ''}
                 onChange={(e) => onUpdate({ placeholder: e.target.value })}
                 className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white outline-none placeholder:text-slate-300"
               />
            </div>
          </div>
        </PropertyGrid>

        {/* Dynamic & Validation Logic */}
        {(field.type === 'select' || field.type === 'radio' || field.type === 'number') && (
          <PropertyGrid title="协议与约束" icon={AlertCircle}>
            {(field.type === 'select' || field.type === 'radio') && (
              <div className="space-y-2">
                <PropertyLabel>{t('form_designer_page.options_label')}</PropertyLabel>
                <textarea
                  value={field.options?.join('\n') || ''}
                  onChange={(e) => onUpdate({ 
                    options: e.target.value.split('\n').filter(o => o.trim())
                  })}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white outline-none resize-none font-mono"
                  placeholder="每行一个选项..."
                />
              </div>
            )}
            
            {field.type === 'number' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <PropertyLabel>{t('form_designer_page.min_value')}</PropertyLabel>
                  <input
                    type="number"
                    value={field.validation?.min || ''}
                    onChange={(e) => onUpdate({ 
                      validation: { ...field.validation, min: e.target.value ? Number(e.target.value) : undefined }
                    })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:bg-white outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <PropertyLabel>{t('form_designer_page.max_value')}</PropertyLabel>
                  <input
                    type="number"
                    value={field.validation?.max || ''}
                    onChange={(e) => onUpdate({ 
                      validation: { ...field.validation, max: e.target.value ? Number(e.target.value) : undefined }
                    })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:bg-white outline-none"
                  />
                </div>
              </div>
            )}
          </PropertyGrid>
        )}

        {/* Security & Access */}
        <PropertyGrid title="访问协议" icon={ShieldCheck}>
           <div className="p-5 bg-slate-50 rounded-[24px] border border-slate-100 space-y-5">
              <div className="flex items-center justify-between group">
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{t('form_designer_page.required_field')}</p>
                   <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest items-center flex gap-1">
                      <div className="w-1 h-1 rounded-full bg-rose-500" /> 需要验证
                   </p>
                </div>
                <button
                  onClick={() => onUpdate({ required: !field.required })}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative p-1",
                    field.required ? "bg-indigo-600" : "bg-slate-200"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 bottom-1 w-4 bg-white rounded-full transition-all",
                    field.required ? "left-7" : "left-1"
                  )} />
                </button>
              </div>

              <div className="w-full h-px bg-slate-200/50" />

              <div className="flex items-center justify-between group">
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">可见性控制</p>
                   <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest items-center flex gap-1">
                      <div className="w-1 h-1 rounded-full bg-emerald-500" /> 默认可见
                   </p>
                </div>
                <button
                  onClick={() => onUpdate({ 
                    permissions: { 
                      ...field.permissions,
                      default: { 
                        ...field.permissions?.default,
                        visible: !(field.permissions?.default?.visible ?? true),
                        editable: field.permissions?.default?.editable ?? true,
                      }
                    }
                  })}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative p-1",
                    (field.permissions?.default?.visible ?? true) ? "bg-indigo-600" : "bg-slate-200"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 bottom-1 w-4 bg-white rounded-full transition-all",
                    (field.permissions?.default?.visible ?? true) ? "left-7" : "left-1"
                  )} />
                </button>
              </div>

              <div className="w-full h-px bg-slate-200/50" />

              <div className="flex items-center justify-between group">
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">写入权限</p>
                   <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest items-center flex gap-1">
                      <div className="w-1 h-1 rounded-full bg-indigo-500" /> 标准可编辑性
                   </p>
                </div>
                <button
                  onClick={() => onUpdate({ 
                    permissions: { 
                      ...field.permissions,
                      default: { 
                        ...field.permissions?.default,
                        visible: field.permissions?.default?.visible ?? true,
                        editable: !(field.permissions?.default?.editable ?? true),
                      }
                    }
                  })}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative p-1",
                    (field.permissions?.default?.editable ?? true) ? "bg-indigo-600" : "bg-slate-200"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 bottom-1 w-4 bg-white rounded-full transition-all",
                    (field.permissions?.default?.editable ?? true) ? "left-7" : "left-1"
                  )} />
                </button>
              </div>
           </div>
        </PropertyGrid>
      </div>
    </div>
  );
}
