import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  User, 
  Zap, 
  Boxes, 
  Database, 
  Calendar, 
  DollarSign,
  Info
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Accessory } from '../../../hooks/useAccessoryDetail';

interface AccessorySpecsTableProps {
  accessory: Accessory;
  isEditing: boolean;
  editForm: Partial<Accessory>;
  onFormChange: (form: Partial<Accessory>) => void;
}

const DetailItem = ({ label, value, icon: Icon, isEditing, children }: any) => (
  <div className="flex flex-col gap-2 p-5 rounded-[24px] bg-slate-50/50 border border-slate-100/50 hover:bg-white hover:shadow-xl transition-all group duration-300 ring-4 ring-transparent hover:ring-indigo-500/5">
    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
      <div className="w-6 h-6 rounded-lg bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:text-indigo-600 transition-colors">
        {Icon && <Icon size={12} strokeWidth={2.5} />}
      </div>
      {label}
    </div>
    <div className="text-sm font-black text-slate-800 tracking-tight pl-1">
      {isEditing ? children : (value || '-')}
    </div>
  </div>
);

export default function AccessorySpecsTable({
  accessory,
  isEditing,
  editForm,
  onFormChange
}: AccessorySpecsTableProps) {
  const { t, i18n } = useTranslation();

  return (
    <div className="premium-card p-10 space-y-8 bg-white border-none shadow-sm rounded-[40px] animate-in fade-in slide-in-from-left-4 duration-700">
      <div className="flex items-center justify-between border-b border-slate-50 pb-6 mb-2">
         <h2 className="text-xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
           <Info size={20} className="text-indigo-500" />
           {t('equipment.fields.technical_params')}
         </h2>
         <span className="px-3 py-1 bg-slate-50 text-[10px] font-black text-slate-300 uppercase tracking-widest rounded-lg border border-slate-100 shadow-inner">
           Metadata Node
         </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <DetailItem label={t('equipment.fields.brand')} value={accessory.brand} icon={User} isEditing={isEditing}>
          <input 
            className="input-standard !py-2 text-xs font-black bg-white ring-4 ring-indigo-500/10" 
            value={editForm.brand || ''} 
            onChange={e => onFormChange({...editForm, brand: e.target.value})} 
          />
        </DetailItem>

        <DetailItem label={t('equipment.fields.category')} value={t(`equipment.category.${accessory.category}`)} icon={Zap} isEditing={isEditing}>
          <select 
            className="input-standard !py-2 text-xs font-black bg-white ring-4 ring-indigo-500/10" 
            value={editForm.category} 
            onChange={e => onFormChange({...editForm, category: e.target.value as any})}
          >
            <option value="accessory">{t('equipment.category.accessory')}</option>
            <option value="instrument">{t('equipment.category.instrument')}</option>
            <option value="fake_load">{t('equipment.category.fake_load')}</option>
            <option value="general">{t('equipment.category.general')}</option>
          </select>
        </DetailItem>

        <DetailItem label={t('equipment.fields.quantity')} value={`${accessory.quantity} ${accessory.unit}`} icon={Boxes} isEditing={isEditing}>
           <div className="flex gap-2">
            <input 
              className="input-standard !py-2 text-xs font-black bg-white ring-4 ring-indigo-500/10 w-full" 
              type="number" 
              value={editForm.quantity} 
              onChange={e => onFormChange({...editForm, quantity: parseInt(e.target.value) || 0})} 
            />
            <input 
              className="input-standard !py-2 text-xs font-black bg-white ring-4 ring-indigo-500/10 w-20" 
              value={editForm.unit} 
              onChange={e => onFormChange({...editForm, unit: e.target.value})} 
            />
           </div>
        </DetailItem>

        <DetailItem label={t('equipment.fields.sn')} value={accessory.serial_number} icon={Database} isEditing={isEditing}>
          <input 
            className="input-standard !py-2 text-xs font-black bg-white ring-4 ring-indigo-500/10 font-mono tracking-tighter" 
            value={editForm.serial_number || ''} 
            onChange={e => onFormChange({...editForm, serial_number: e.target.value})} 
          />
        </DetailItem>

        <DetailItem label={t('equipment.fields.purchase_date')} value={accessory.purchase_date && new Date(accessory.purchase_date).toLocaleDateString(i18n.language)} icon={Calendar} isEditing={isEditing}>
          <input 
            className="input-standard !py-2 text-xs font-black bg-white ring-4 ring-indigo-500/10" 
            type="date" 
            value={editForm.purchase_date?.slice(0, 10)} 
            onChange={e => onFormChange({...editForm, purchase_date: e.target.value})} 
          />
        </DetailItem>

        <DetailItem label={t('equipment.fields.purchase_price')} value={accessory.purchase_price ? `¥${accessory.purchase_price.toLocaleString()}` : '¥0.00'} icon={DollarSign} isEditing={isEditing}>
          <div className="relative group/price">
             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 font-bold">¥</span>
             <input 
               className="input-standard !py-2 pl-7 text-xs font-black bg-white ring-4 ring-indigo-500/10 tabular-nums" 
               type="number" 
               value={editForm.purchase_price} 
               onChange={e => onFormChange({...editForm, purchase_price: parseFloat(e.target.value) || 0})} 
             />
          </div>
        </DetailItem>
      </div>
    </div>
  );
}
