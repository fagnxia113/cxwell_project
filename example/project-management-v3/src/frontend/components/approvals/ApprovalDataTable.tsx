import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Tag, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  RotateCcw 
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { ApprovalOrder } from '../../hooks/useMyApprovals';
import { getOrderTypeConfigs, getStatusConfigs } from '../../constants/workflowConstants';

interface ApprovalDataTableProps {
  orders: ApprovalOrder[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSelect: (order: ApprovalOrder) => void;
  onWithdraw: (id: string, e: React.MouseEvent) => void;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '-';
  return date.toISOString().split('T')[0];
};

export default function ApprovalDataTable({
  orders,
  loading,
  totalCount,
  currentPage,
  totalPages,
  onPageChange,
  onSelect,
  onWithdraw
}: ApprovalDataTableProps) {
  const { t } = useTranslation();
  const orderTypeConfigs = getOrderTypeConfigs(t);
  const statusConfigs = getStatusConfigs(t);

  const getStatusBadge = (status: string) => {
    const config = statusConfigs[status] || statusConfigs['pending'];
    const Icon = config.icon;
    return (
      <div className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all", 
        config.bgColor, config.color, "border-transparent shadow-sm", config.glow
      )}>
        <Icon className="w-3.5 h-3.5" strokeWidth={3} />
        {config.label}
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-16">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-in fade-in duration-700">
        <div className="col-span-1">{t('workflow.fields.sn') || 'ARCH'}</div>
        <div className="col-span-4">{t('workflow.fields.title')}</div>
        <div className="col-span-2">{t('workflow.fields.time') || 'DATE'}</div>
        <div className="col-span-2">{t('workflow.fields.node_handler') || 'NODE/HANDLER'}</div>
        <div className="col-span-2 text-center">{t('common.status')}</div>
        <div className="col-span-1"></div>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {loading ? (
             Array.from({length: 6}).map((_, i) => (
                <div key={i} className="premium-card h-24 bg-white/40 animate-pulse border-none rounded-[32px]" />
             ))
          ) : orders.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="py-24 text-center space-y-6 bg-white/40 backdrop-blur-md rounded-[48px] border-2 border-dashed border-slate-100 grayscale opacity-40"
            >
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-inner">
                <FileText size={40} className="text-slate-200" />
              </div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">{t('common.noData')}</p>
            </motion.div>
          ) : (
            orders.map((order, idx) => {
              const typeConfig = orderTypeConfigs[order.order_type] || { label: order.order_type, color: 'slate', icon: FileText };
              const TypeIcon = typeConfig.icon;
              
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => onSelect(order)}
                  className="grid grid-cols-12 gap-4 px-6 py-5 items-center premium-card border-none bg-white hover:bg-slate-50 hover:shadow-2xl hover:shadow-indigo-500/5 cursor-pointer transition-all duration-500 group rounded-[32px]"
                >
                  <div className="col-span-1">
                     <span className="text-[10px] font-black font-mono text-slate-300 group-hover:text-indigo-500 transition-colors uppercase tracking-tight">
                        #{order.order_no}
                     </span>
                  </div>

                  <div className="col-span-4 flex items-center gap-5">
                     <div className={cn(
                       "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6",
                       typeConfig.color === 'blue' && 'bg-blue-600 shadow-blue-500/20',
                       typeConfig.color === 'emerald' && 'bg-emerald-600 shadow-emerald-500/20',
                       typeConfig.color === 'amber' && 'bg-amber-600 shadow-amber-500/20',
                       typeConfig.color === 'indigo' && 'bg-indigo-600 shadow-indigo-500/20',
                       typeConfig.color === 'rose' && 'bg-rose-600 shadow-rose-500/20',
                       typeConfig.color === 'pink' && 'bg-pink-600 shadow-pink-500/20',
                       typeConfig.color === 'slate' && 'bg-slate-700 shadow-slate-700/20',
                       typeConfig.color === 'violet' && 'bg-violet-600 shadow-violet-500/20',
                       typeConfig.color === 'cyan' && 'bg-cyan-600 shadow-cyan-500/20'
                     )}>
                        <TypeIcon size={20} strokeWidth={2.5} />
                     </div>
                     <div className="min-w-0 space-y-1.5">
                        <h4 className="text-base font-black text-slate-800 tracking-tight group-hover:text-indigo-600 truncate transition-colors uppercase">{order.title}</h4>
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                              <Tag size={12} className="text-slate-300" />
                           </div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{typeConfig.label}</p>
                        </div>
                     </div>
                  </div>

                  <div className="col-span-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{formatDate(order.created_at)}</span>
                  </div>

                  <div className="col-span-2">
                     <div className="space-y-1.5">
                        <span className="text-xs font-black text-slate-700 uppercase tracking-tight truncate block">{order.current_node}</span>
                        {order.current_assignee_name && (
                           <div className="flex items-center gap-1.5">
                              <div className="w-1 h-1 rounded-full bg-slate-300" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{order.current_assignee_name}</span>
                           </div>
                        )}
                     </div>
                  </div>

                  <div className="col-span-2 text-center">
                     {getStatusBadge(order.status)}
                  </div>

                  <div className="col-span-1 text-right flex items-center justify-end">
                     <div className="opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500 flex gap-2">
                        {order.status === 'pending' && (
                           <button
                             onClick={(e) => onWithdraw(order.id, e)}
                             className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-100 transition-all shadow-sm active:scale-90"
                             title={t('workflow.action.withdraw')}
                           >
                              <RotateCcw size={16} strokeWidth={3} />
                           </button>
                        )}
                        <div className="w-10 h-10 flex items-center justify-center text-white bg-slate-900 rounded-xl group-hover:bg-indigo-600 shadow-xl shadow-indigo-500/0 group-hover:shadow-indigo-500/20 transition-all active:scale-90">
                           <ArrowRight size={18} strokeWidth={3} />
                        </div>
                     </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>

        {/* Improved Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-8 py-5 bg-white/40 backdrop-blur-xl rounded-[40px] border border-white mt-8 shadow-sm">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {t('common.total')} <span className="text-indigo-600 font-mono">{totalCount}</span> {t('common.records')}
              <span className="mx-3 opacity-20">|</span> 
              {t('common.page')} <span className="text-slate-900 font-mono">{currentPage}</span> / <span className="text-slate-900 font-mono">{totalPages}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                disabled={currentPage === 1}
                onClick={(e) => { e.stopPropagation(); onPageChange(currentPage - 1); }}
                className={cn(
                  "px-5 py-2.5 rounded-2xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border",
                  currentPage === 1 
                    ? "bg-slate-50/50 border-slate-100 text-slate-300 pointer-events-none" 
                    : "bg-white border-slate-100 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 hover:shadow-lg active:scale-95 shadow-sm"
                )}
              >
                <ChevronLeft size={16} strokeWidth={3} />
                {t('common.prev_page')}
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={(e) => { e.stopPropagation(); onPageChange(currentPage + 1); }}
                className={cn(
                  "px-5 py-2.5 rounded-2xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border",
                  currentPage === totalPages 
                    ? "bg-slate-50/50 border-slate-100 text-slate-300 pointer-events-none" 
                    : "bg-white border-slate-100 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 hover:shadow-lg active:scale-95 shadow-sm"
                )}
              >
                {t('common.next_page')}
                <ChevronRight size={16} strokeWidth={3} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
