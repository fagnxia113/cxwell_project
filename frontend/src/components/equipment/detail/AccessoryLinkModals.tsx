import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Layers, 
  Activity, 
  AlertCircle, 
  Unlink, 
  PlusCircle,
  Hash,
  Play
} from 'lucide-react'
import { cn } from '../../../utils/cn';
import { Accessory } from '../../../hooks/useEquipmentDetail';

interface BindAccessoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  accessories: Accessory[];
  onConfirm: (accessoryId: string, quantity: number) => void;
  actionLoading: boolean;
}

export function BindAccessoryModal({
  isOpen,
  onClose,
  loading,
  accessories,
  onConfirm,
  actionLoading
}: BindAccessoryModalProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Accessory | null>(null);
  const [qty, setQty] = useState(1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[200] p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 10 }} 
        className="bg-white rounded-[40px] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col border border-white/20"
      >
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-3">
              <PlusCircle className="text-indigo-600" size={24} /> {t('equipment.action.bind')}
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none pl-9">Link Technical Resources</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-300 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-10 space-y-10 overflow-y-auto max-h-[60vh] custom-scrollbar">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{t('equipment.action.select_accessory')}</label>
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                 <div className="w-10 h-10 border-4 border-slate-100 border-t-indigo-500 rounded-full animate-spin" />
                 <p className="text-xs font-black text-slate-300 uppercase tracking-widest">{t('equipment.action.loading_resources')}</p>
              </div>
            ) : accessories.length === 0 ? (
              <div className="py-16 bg-slate-50 rounded-[32px] flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200">
                 <AlertCircle size={32} className="mb-4 opacity-30" />
                 <p className="text-xs font-bold uppercase tracking-widest">{t('equipment.error.no_idle_accessories')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {accessories.map(acc => (
                  <button 
                    key={acc.id} 
                    onClick={() => {
                        setSelected(acc);
                        setQty(1);
                    }} 
                    className={cn(
                      "flex items-center justify-between p-5 rounded-3xl border-2 transition-all text-left group", 
                      selected?.id === acc.id 
                        ? "bg-indigo-600 border-indigo-500 shadow-xl shadow-indigo-500/20" 
                        : "bg-white border-slate-100 hover:border-indigo-200 shadow-sm"
                    )}
                  >
                    <div className="min-w-0">
                      <p className={cn("font-black tracking-tight", selected?.id === acc.id ? "text-white" : "text-slate-900")}>
                        {acc.accessory_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                         <Hash size={10} className={cn(selected?.id === acc.id ? "text-white/40" : "text-slate-300")} />
                         <p className={cn("text-[9px] font-bold italic uppercase tracking-tighter", selected?.id === acc.id ? "text-white/60" : "text-slate-400")}>
                           {acc.manage_code || 'NO-ID'}
                         </p>
                      </div>
                    </div>
                    <div className={cn(
                      "flex flex-col items-end px-3 py-1.5 rounded-2xl",
                      selected?.id === acc.id ? "bg-white/10" : "bg-slate-50"
                    )}>
                       <p className={cn("text-[9px] font-black uppercase tracking-widest leading-none mb-1", selected?.id === acc.id ? "text-white/50" : "text-slate-400")}>Available</p>
                       <span className={cn("text-xs font-black", selected?.id === acc.id ? "text-white" : "text-slate-900")}>{acc.quantity} {acc.unit}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <AnimatePresence>
            {selected && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }} 
                className="space-y-4 pt-4 border-t border-slate-50 overflow-hidden"
              >
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{t('equipment.action.bind_qty')}</label>
                <div className="flex items-center gap-8 justify-center p-10 bg-slate-50 rounded-[32px] shadow-inner relative group/qty">
                   <button 
                     onClick={() => setQty(q => Math.max(1, q - 1))} 
                     className="w-14 h-14 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center text-2xl font-black text-slate-300 hover:border-indigo-500 hover:text-indigo-500 transition-all shadow-sm active:scale-90"
                   >
                     -
                   </button>
                   <div className="flex flex-col items-center">
                      <input 
                        type="number" 
                        className="w-32 text-6xl font-black text-center bg-transparent border-none outline-none text-slate-900 tabular-nums" 
                        value={qty} 
                        onChange={e => setQty(Math.min(selected.quantity, Math.max(1, parseInt(e.target.value) || 1)))} 
                      />
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mt-2 underline decoration-indigo-200 underline-offset-4">{selected.unit} UNIT</span>
                   </div>
                   <button 
                     onClick={() => setQty(q => Math.min(selected.quantity, q + 1))} 
                     className="w-14 h-14 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center text-2xl font-black text-slate-300 hover:border-indigo-500 hover:text-indigo-500 transition-all shadow-sm active:scale-90"
                   >
                     +
                   </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-10 border-t border-slate-50 bg-slate-50/50 flex gap-4">
          <button 
            onClick={onClose} 
            className="flex-1 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all rounded-[20px] hover:bg-white"
          >
            {t('common.cancel')}
          </button>
          <button 
            disabled={!selected || actionLoading} 
            onClick={() => selected && onConfirm(selected.id, qty)} 
            className="flex-[2] py-5 bg-slate-900 text-white rounded-[24px] font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-slate-900/30 hover:bg-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            {actionLoading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Play size={16} fill="currentColor" />}
            {t('common.confirm')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

interface UnbindAccessoryModalProps {
  accessory: Accessory | null;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
  actionLoading: boolean;
}

export function UnbindAccessoryModal({
  accessory,
  onClose,
  onConfirm,
  actionLoading
}: UnbindAccessoryModalProps) {
  const { t } = useTranslation();
  const [qty, setQty] = useState(1);

  if (!accessory) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[200] p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.95 }} 
        className="bg-white rounded-[48px] shadow-2xl w-full max-w-md overflow-hidden flex flex-col p-12 items-center text-center border border-white/20"
      >
        <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[32px] flex items-center justify-center shadow-inner mb-8 ring-8 ring-rose-500/5">
          <Unlink size={40} strokeWidth={2.5} />
        </div>
        
        <div className="space-y-3 mb-10">
           <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">{t('equipment.action.confirm_unbind')}</h3>
           <p className="text-sm font-bold text-slate-400 leading-relaxed px-6">
              {t('equipment.action.unbind_desc')} <br/>
              <span className="text-slate-900 font-black inline-block mt-2 px-3 py-1 bg-slate-100 rounded-lg">{accessory.accessory_name}</span>
           </p>
        </div>
        
        <div className="w-full space-y-4 mb-12">
          <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{t('equipment.action.unbind_qty')}</label>
          <div className="flex items-center justify-center gap-8 bg-slate-50 p-6 rounded-[32px] shadow-inner">
            <button 
              onClick={() => setQty(q => Math.max(1, q - 1))} 
              className="w-12 h-12 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:border-rose-500 hover:text-rose-500 transition-all active:scale-90"
            >
              -
            </button>
            <input 
              type="number" 
              className="w-20 text-4xl font-black text-center bg-transparent border-none outline-none text-slate-900 tabular-nums" 
              value={qty} 
              onChange={e => setQty(Math.min(accessory.quantity, Math.max(1, parseInt(e.target.value) || 1)))} 
            />
            <button 
              onClick={() => setQty(q => Math.min(accessory.quantity, q + 1))} 
              className="w-12 h-12 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:border-rose-500 hover:text-rose-500 transition-all active:scale-90"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex flex-col w-full gap-4">
          <button 
            onClick={() => onConfirm(qty)} 
            disabled={actionLoading} 
            className="w-full py-5 bg-rose-600 text-white rounded-[24px] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-rose-600/30 hover:bg-rose-700 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {actionLoading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Unlink size={18} />}
            {t('common.confirm')}
          </button>
          <button 
            onClick={onClose} 
            className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-all"
          >
            {t('common.cancel')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
