import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, 
  History as HistoryIcon, 
  Layers, 
  Building, 
  Hash, 
  Package, 
  Calendar, 
  CreditCard, 
  Briefcase, 
  ShieldCheck, 
  Link2, 
  FileText, 
  Download 
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Equipment } from '../../../hooks/useEquipmentDetail';

interface EquipmentDetailsTabsProps {
  equipment: Equipment;
  onTabChange: (tab: string) => void;
  activeTab: string;
}

const DetailSlot = ({ label, value, icon: Icon, color = "blue" }: any) => (
  <div className="flex items-center gap-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-100 group hover:bg-white transition-all shadow-sm hover:shadow-md duration-300">
    <div className={cn(
      "p-3 rounded-xl transition-all shadow-inner border border-transparent group-hover:border-inherit",
      color === 'blue' ? 'bg-blue-50 text-blue-600 border-blue-100' :
      color === 'emerald' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
      color === 'amber' ? 'bg-amber-50 text-amber-600 border-amber-100' :
      color === 'indigo' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-100 text-slate-400'
    )}>
      <Icon size={20} strokeWidth={2.5} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</p>
      <p className="text-sm font-black text-slate-900 truncate tracking-tight">{value || '-'}</p>
    </div>
  </div>
);

export default function EquipmentDetailsTabs({ equipment, onTabChange, activeTab }: EquipmentDetailsTabsProps) {
  const { t, i18n } = useTranslation();

  const tabs = [
    { id: 'specs', label: t('equipment.fields.spec'), icon: Cpu },
    { id: 'lifecycle', label: t('equipment.fields.lifecycle'), icon: HistoryIcon },
    { id: 'accessories', label: t('sidebar.accessories'), icon: Layers }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Tab Switcher */}
      <div className="flex items-center gap-2 p-2 bg-white rounded-[24px] border border-slate-100 w-full max-w-fit shadow-sm overflow-x-auto custom-scrollbar">
        {tabs.map(tab => (
          <button 
            key={tab.id} 
            onClick={() => onTabChange(tab.id)} 
            className={cn(
              "px-8 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20" 
                : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            <tab.icon size={14} strokeWidth={3} /> {tab.label}
            {tab.id === 'accessories' && equipment.accessories && equipment.accessories.length > 0 && (
              <span className={cn(
                "px-2 py-0.5 rounded-md text-[9px] font-black shadow-sm", 
                activeTab === tab.id ? "bg-white/20 text-white" : "bg-indigo-600 text-white"
              )}>
                {equipment.accessories.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={activeTab} 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          exit={{ opacity: 0, x: -20 }} 
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          {activeTab === 'specs' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailSlot label={t('equipment.fields.location')} value={equipment.location_name} icon={Building} color="blue" />
                <DetailSlot label={t('equipment.fields.sn')} value={equipment.serial_number} icon={Hash} color="indigo" />
                <DetailSlot label={t('equipment.fields.quantity')} value={`${equipment.quantity} ${equipment.unit}`} icon={Package} color="emerald" />
                <DetailSlot label={t('equipment.fields.purchase_date')} value={equipment.purchase_date && new Date(equipment.purchase_date).toLocaleDateString(i18n.language)} icon={Calendar} color="amber" />
              </div>
              <div className="premium-card p-10 bg-white border-none shadow-sm rounded-[32px]">
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-3">
                   <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                   {t('equipment.fields.technical_params')}
                </h3>
                <div className="p-8 bg-slate-50/50 rounded-[24px] border border-slate-100 text-sm font-bold text-slate-600 italic leading-relaxed font-mono shadow-inner">
                  {equipment.technical_params || t('common.noData')}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'lifecycle' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DetailSlot label={t('equipment.fields.purchase_date')} value={equipment.purchase_date} icon={Calendar} color="blue" />
                <DetailSlot label={t('equipment.fields.purchase_price')} value={equipment.purchase_price ? `¥${equipment.purchase_price.toLocaleString()}` : '-'} icon={CreditCard} color="emerald" />
                <DetailSlot label={t('equipment.fields.supplier')} value={equipment.supplier} icon={Briefcase} color="amber" />
              </div>
              
              {/* Instrument Certificate Panel */}
              {equipment.category === 'instrument' && (
                <div className="premium-card p-10 bg-slate-900 border-none rounded-[40px] overflow-hidden relative shadow-2xl shadow-indigo-900/10 group">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 blur-[80px] -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-[2000ms]" />
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 relative z-10">
                    <div className="flex items-center gap-8">
                      <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center text-indigo-400 backdrop-blur-md shadow-2xl border border-white/10">
                        <ShieldCheck size={40} strokeWidth={2.5} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 leading-none">{t('equipment.fields.certificate_no')}</p>
                        <p className="text-3xl font-black text-white tracking-tighter leading-none">{equipment.certificate_no || 'ARCH-0000000'}</p>
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-3 flex items-center gap-2">
                           <Building size={12} /> {equipment.certificate_issuer || t('common.not_specified')}
                        </p>
                      </div>
                    </div>
                    <div className="bg-white/5 p-6 px-10 rounded-3xl border border-white/10 backdrop-blur-md text-center shadow-inner">
                      <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1.5 leading-none">{t('equipment.fields.expiry')}</p>
                      <p className="text-3xl font-black text-white tracking-tighter tabular-nums">{equipment.calibration_expiry || t('common.all')}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Attachments Section */}
              <div className="premium-card p-10 bg-white border-none shadow-sm rounded-[32px]">
                <div className="flex items-center justify-between border-b border-slate-50 pb-8 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                       <Link2 size={24} strokeWidth={2.5} />
                    </div>
                    <div className="space-y-1">
                       <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">{t('common.attachment')}</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Standard Compliance Docs</p>
                    </div>
                  </div>
                  <span className="px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest shadow-sm">
                    {t('common.total')} {equipment.attachments?.length || 0}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {equipment.attachments?.length ? equipment.attachments.map((file, i) => (
                    <a 
                      key={i} 
                      href={file.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="p-5 bg-slate-50/50 hover:bg-white border border-slate-100 transition-all rounded-[24px] flex items-center justify-between group shadow-sm hover:shadow-xl hover:-translate-y-1 duration-300"
                    >
                      <div className="flex items-center gap-5 min-w-0">
                        <div className="w-12 h-12 bg-white shadow-sm rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                           <FileText size={20} />
                        </div>
                        <div className="min-w-0">
                           <p className="text-sm font-black text-slate-900 truncate tracking-tight">{file.name || `ATTACH_0${i+1}`}</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Locked · Regulatory</p>
                        </div>
                      </div>
                      <div className="p-2 bg-slate-100 rounded-xl text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                        <Download size={16} />
                      </div>
                    </a>
                  )) : (
                    <div className="col-span-full py-24 flex flex-col items-center justify-center opacity-30 grayscale items-center">
                       <FileText size={48} className="mb-4" />
                       <p className="text-xs font-black uppercase tracking-[0.2em]">{t('equipment.empty.no_docs')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
