import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Building, 
  User, 
  Database, 
  MapPin, 
  Info 
} from 'lucide-react';
import { getFormFieldLabels, getEnumLabels } from '../../constants/workflowConstants';

interface ApprovalFormPayloadViewProps {
  formData: Record<string, any>;
  orderType: string;
}

export default function ApprovalFormPayloadView({
  formData,
  orderType
}: ApprovalFormPayloadViewProps) {
  const { t } = useTranslation();
  const fieldLabels = getFormFieldLabels(t);
  const enumLabels = getEnumLabels(t);

  // Helper to get nested value or key conversion
  const getDisplayValue = (key: string, value: any) => {
    if (value === null || value === undefined || value === '') return '--';
    
    let display = String(value);
    
    if (key === 'gender') display = (enumLabels.gender as any)[String(value)] || display;
    else if (key === 'employee_type') display = (enumLabels.employeeType as any)[String(value)] || display;
    else if (key === 'inbound_type') display = (enumLabels.inboundType as any)[String(value)] || display;
    else if (key === 'receiveStatus') display = (enumLabels.receiveStatus as any)[String(value)] || display;
    else if (key === 'category') display = (enumLabels.category as any)[String(value)] || display;
    else if (key === 'locationType') display = (enumLabels.locationType as any)[String(value)] || display;
    
    // Check for internal mappings like _deptMap or _posMap
    const deptMap = formData._deptMap || {};
    const posMap = formData._posMap || {};
    if (key === 'department_id') display = deptMap[String(value)] || display;
    else if (key === 'position_id') display = posMap[String(value)] || display;
    
    return display;
  };

  const entries = Object.entries(formData)
    .filter(([key]) => !key.startsWith('_') && key !== 'items')
    .filter(([key]) => orderType !== 'equipment-transfer' || !['fromLocationId', 'toLocationId', 'fromManagerId', 'toManagerId'].includes(key));

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. Special: Equipment Transfer Matrix */}
      {orderType === 'equipment-transfer' && formData.items && Array.isArray(formData.items) && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-6">
             <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
             <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('equipment.fields.items')}</h5>
          </div>
          <div className="overflow-hidden rounded-[32px] border border-slate-100 shadow-sm bg-white">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-8 py-5">{t('equipment.fields.name')}</th>
                  <th className="px-8 py-5">{t('equipment.fields.model')}</th>
                  <th className="px-8 py-5 text-center">{t('equipment.fields.qty')}</th>
                  <th className="px-8 py-5">{t('equipment.fields.code')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {formData.items.map((item: any, idx: number) => (
                  <tr key={idx} className="text-sm text-slate-700 hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-[10px]">
                           {idx + 1}
                        </div>
                        <span className="font-black text-slate-900">{item.equipment_name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 font-bold">{item.model_no || '--'}</td>
                    <td className="px-8 py-5 text-center">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-mono font-black border border-indigo-100">
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="font-mono text-[10px] font-black text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded-md">
                        {item.manage_code || '--'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Common Key-Value Matrix */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
           <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
           <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('workflow.fields.payload')}</h5>
        </div>
        
        {entries.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-10 gap-x-12 px-2">
            {entries.map(([key, value]) => (
              <div key={key} className="space-y-2 group">
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-indigo-400 transition-colors" />
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] leading-none">
                     {fieldLabels[key] || key.replace(/_/g, ' ')}
                   </p>
                </div>
                <div className="bg-slate-50/50 group-hover:bg-white p-4 rounded-2xl border border-transparent group-hover:border-slate-100 group-hover:shadow-lg group-hover:shadow-slate-200/50 transition-all duration-300">
                   <p className="text-sm font-black text-slate-800 leading-tight tracking-tight">
                     {getDisplayValue(key, value)}
                   </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 flex flex-col items-center justify-center bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-100 grayscale opacity-40">
            <Info size={40} className="mb-4 text-slate-300" />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Archival payload empty</p>
          </div>
        )}
      </div>
    </div>
  );
}
