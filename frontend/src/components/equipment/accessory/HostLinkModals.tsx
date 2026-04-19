import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Link as LinkIcon, 
  Activity, 
  AlertCircle, 
  ArrowRight, 
  ChevronLeft,
  Unlink,
  Hash
} from 'lucide-react';
import { cn } from '../../../utils/cn';

interface Host {
  id: string;
  equipment_name: string;
  manage_code: string;
}

interface BindHostModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  availableHosts: Host[];
  onConfirm: (hostId: string, quantity: number) => void;
  actionLoading: boolean;
  maxQty: number;
}

export function BindHostModal({
  isOpen,
  onClose,
  loading,
  availableHosts,
  onConfirm,
  actionLoading,
  maxQty
}: BindHostModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'select' | 'quantity'>('select');
  const [selected, setSelected] = useState<Host | null>(null);
  const [qty, setQty] = useState(1);

  if (!isOpen) return null;

  const handleClose = () => {
    setStep('select');
    setSelected(null);
    setQty(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[200] p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }} 
        className="bg-white rounded-[48px] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col border border-white/20"
      >
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <div className="flex items-center gap-4">
             {step === 'quantity' && (
                <button 
                  onClick={() => setStep('select')} 
                  className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all active:scale-90"
                >
                   <ChevronLeft size={20} strokeWidth={3} />
                </button>
             )}
             <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-3">
                  <LinkIcon className="text-indigo-500" size={24} /> 
                  Link Protocol
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-9 leading-none">Archival Connectivity</p>
             </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-300">
            <X size={24} />
          </button>
        </div>

        <div className="p-10 space-y-10 overflow-y-auto max-h-[60vh] custom-scrollbar">
          <AnimatePresence mode="wait">
            {step === 'select' ? (
              <motion.div 
                key="select"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between px-2">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('equipment.action.select_host', 'Target Host Matrix')}</p>
                   <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-tighter shadow-inner">Scanner Active</span>
                </div>
                
                {loading ? (
                  <div className="py-24 flex flex-col items-center justify-center gap-5">
                     <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-500 rounded-full animate-spin" />
                     <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Scanning local infrastructure...</p>
                  </div>
                ) : availableHosts.length === 0 ? (
                  <div className="py-20 bg-slate-50 rounded-[40px] flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100">
                     <AlertCircle size={40} className="mb-4 opacity-20" />
                     <p className="text-xs font-bold uppercase tracking-widest">{t('equipment.error.no_idle_hosts', 'No Suitable Hosts Available')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {availableHosts.map(host => (
                      <button 
                        key={host.id} 
                        onClick={() => setSelected(host)} 
                        className={cn(
                          "flex items-center justify-between p-6 rounded-[32px] border-2 transition-all text-left group", 
                          selected?.id === host.id 
                            ? "bg-indigo-600 border-indigo-500 shadow-2xl shadow-indigo-500/30" 
                            : "bg-white border-slate-100 hover:border-indigo-200 shadow-sm"
                        )}
                      >
                        <div className="min-w-0">
                          <p className={cn("font-black tracking-tight text-base truncate", selected?.id === host.id ? "text-white" : "text-slate-900")}>
                            {host.equipment_name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                             <Hash size={10} className={cn(selected?.id === host.id ? "text-white/40" : "text-slate-300")} />
                             <p className={cn("text-[10px] font-black uppercase tracking-tighter tabular-nums", selected?.id === host.id ? "text-white/60" : "text-slate-400")}>
                               {host.manage_code}
                             </p>
                          </div>
                        </div>
                        <ArrowRight size={20} className={cn(
                          "transition-all duration-500", 
                          selected?.id === host.id 
                            ? "text-white translate-x-0 opacity-100" 
                            : "text-slate-200 -translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"
                        )} />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="quantity"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10 py-6"
              >
                 <div className="p-8 bg-slate-900 rounded-[40px] text-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[40px] -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none block mb-2 relative z-10">Target Infrastructure</span>
                    <p className="text-2xl font-black tracking-tighter relative z-10 leading-tight">{selected?.equipment_name}</p>
                    <div className="flex items-center gap-2 mt-3 opacity-60 relative z-10 tabular-nums font-mono text-xs">
                       <Hash size={12} /> {selected?.manage_code}
                    </div>
                 </div>
                 
                 <div className="flex flex-col items-center gap-6">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest tracking-[0.2em]">{t('equipment.action.bind_qty', 'Severance Quota')}</label>
                    <div className="flex items-center gap-12 justify-center p-12 bg-slate-50 rounded-[40px] shadow-inner relative ring-8 ring-slate-50/50">
                       <button 
                         onClick={() => setQty(q => Math.max(1, q - 1))} 
                         className="w-16 h-16 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center text-3xl font-black text-slate-300 hover:border-indigo-500 hover:text-indigo-500 transition-all shadow-xl shadow-slate-900/5 active:scale-90"
                       >
                         -
                       </button>
                       <div className="flex flex-col items-center">
                          <input 
                            type="number" 
                            className="w-40 text-7xl font-black text-center bg-transparent border-none outline-none text-slate-900 tabular-nums" 
                            value={qty} 
                            onChange={e => setQty(Math.min(maxQty, Math.max(1, parseInt(e.target.value) || 1)))} 
                          />
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mt-2 underline decoration-indigo-200 underline-offset-8 decoration-4">Units</p>
                       </div>
                       <button 
                         onClick={() => setQty(q => Math.min(maxQty, q + 1))} 
                         className="w-16 h-16 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center text-3xl font-black text-slate-300 hover:border-indigo-500 hover:text-indigo-500 transition-all shadow-xl shadow-slate-900/5 active:scale-90"
                       >
                         +
                       </button>
                    </div>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">Archive Maximum Capacity: {maxQty}</p>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-10 border-t border-slate-50 bg-slate-50/30 flex gap-5">
           <button 
            onClick={handleClose} 
            className="flex-1 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all bg-white rounded-[24px] border border-slate-100 shadow-sm"
           >
              {t('common.cancel')}
           </button>
           <button 
            disabled={!selected || actionLoading} 
            onClick={() => {
              if (step === 'select') setStep('quantity');
              else if (selected) onConfirm(selected.id, qty);
            }} 
            className="flex-[2] py-5 bg-slate-900 text-white rounded-[28px] font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-slate-900/30 hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3"
           >
             {actionLoading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : step === 'select' ? "Initialize Link" : "Finalize Protocol"}
             {step === 'select' && !actionLoading && <ArrowRight size={16} strokeWidth={4} />}
           </button>
        </div>
      </motion.div>
    </div>
  );
}

interface UnbindModalProps {
  accessoryName?: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
  actionLoading: boolean;
  maxQty: number;
}

export function UnbindHostModal({
  accessoryName,
  isOpen,
  onClose,
  onConfirm,
  actionLoading,
  maxQty
}: UnbindModalProps) {
  const { t } = useTranslation();
  const [qty, setQty] = useState(1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[200] p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
       <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.95 }} 
        className="bg-white rounded-[56px] shadow-2xl w-full max-w-md overflow-hidden flex flex-col p-12 items-center text-center border border-white/20"
      >
          <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[38px] flex items-center justify-center shadow-inner mb-8 ring-12 ring-rose-500/5 rotate-12">
             <Unlink size={44} strokeWidth={2.5} />
          </div>
          
          <div className="space-y-3 mb-12">
             <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">{t('equipment.action.confirm_unbind', 'Link Severance')}</h3>
             <p className="text-sm font-bold text-slate-400 leading-relaxed max-w-[280px] mx-auto">
                {t('equipment.action.unbind_desc', 'Manual decoupling requested for asset component:')} <br/>
                <span className="text-slate-900 font-black inline-block mt-3 px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-xl leading-none">{accessoryName || 'COMPONENT'}</span>
             </p>
          </div>
          
          <div className="w-full space-y-4 mb-14">
             <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{t('equipment.action.unbind_qty', 'Severance Quota')}</label>
             <div className="flex items-center justify-center gap-10 bg-slate-50 p-8 rounded-[40px] shadow-inner relative ring-8 ring-slate-50/50">
                <button 
                  onClick={() => setQty(q => Math.max(1, q - 1))} 
                  className="w-12 h-12 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:border-rose-500 hover:text-rose-500 transition-all active:scale-90"
                >
                   -
                </button>
                <div className="flex flex-col items-center">
                   <input 
                    type="number" 
                    className="w-16 text-4xl font-black text-center bg-transparent border-none outline-none text-slate-900 tabular-nums" 
                    value={qty} 
                    onChange={e => setQty(Math.min(maxQty, Math.max(1, parseInt(e.target.value) || 1)))} 
                   />
                </div>
                <button 
                  onClick={() => setQty(q => Math.min(maxQty, q + 1))} 
                  className="w-12 h-12 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:border-rose-500 hover:text-rose-500 transition-all active:scale-90"
                >
                   +
                </button>
             </div>
          </div>

          <div className="flex flex-col w-full gap-4 relative z-10">
             <button 
              onClick={() => onConfirm(qty)} 
              disabled={actionLoading} 
              className="w-full py-5 bg-rose-600 text-white rounded-[28px] font-black text-[12px] uppercase tracking-[0.2em] shadow-2xl shadow-rose-600/30 hover:bg-rose-700 active:scale-95 transition-all flex items-center justify-center gap-3"
             >
                {actionLoading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Unlink size={20} />}
                Finalize Severance
             </button>
             <button 
              onClick={onClose} 
              className="w-full py-4 text-slate-400 font-black text-[11px] uppercase tracking-widest hover:text-slate-600 transition-all"
             >
                {t('common.cancel')}
             </button>
          </div>
       </motion.div>
    </div>
  );
}
