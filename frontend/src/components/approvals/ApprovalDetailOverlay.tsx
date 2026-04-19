import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  GitBranch, 
  User, 
  Clock, 
  RotateCcw, 
  Calendar,
  Layers
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { ApprovalOrder } from '../../hooks/useMyApprovals';
import { getStatusConfigs, getOrderTypeConfigs } from '../../constants/workflowConstants';
import ApprovalFormPayloadView from './ApprovalFormPayloadView';

interface ApprovalDetailOverlayProps {
  order: ApprovalOrder | null;
  onClose: () => void;
  onWithdraw: (id: string) => void;
  onVisualize: (id: string) => void;
  actionLoading: boolean;
}

const MetadataItem = ({ label, value, icon: Icon }: any) => (
  <div className="bg-slate-50 p-6 rounded-[28px] border border-slate-100/50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
       <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-indigo-400 transition-colors" />
       {label}
    </p>
    <div className="font-black text-slate-900 text-sm flex items-center gap-3 tracking-tight">
      <div className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm text-indigo-500 group-hover:rotate-12 transition-transform">
        {Icon && <Icon size={14} strokeWidth={2.5} />}
      </div>
      {value || '--'}
    </div>
  </div>
);

export default function ApprovalDetailOverlay({
  order,
  onClose,
  onWithdraw,
  onVisualize,
  actionLoading
}: ApprovalDetailOverlayProps) {
  const { t } = useTranslation();
  const statusConfigs = getStatusConfigs(t);
  const orderTypeConfigs = getOrderTypeConfigs(t);

  if (!order) return null;

  const config = statusConfigs[order.status] || statusConfigs['pending'];
  const StatusIcon = config.icon;
  const typeConfig = orderTypeConfigs[order.order_type] || { label: order.order_type, color: 'slate', icon: Layers };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xl flex items-center justify-center z-[100] p-4 lg:p-8 animate-in fade-in duration-500">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 40 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-[56px] shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-white/20"
      >
        {/* Cinematic Header */}
        <div className="px-12 py-12 flex justify-between items-start bg-slate-50/50 border-b border-slate-100 relative shrink-0">
           <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all", 
                  config.bgColor, config.color, "border-transparent shadow-xl", config.glow
                )}>
                  <StatusIcon className="w-4 h-4" strokeWidth={3} />
                  {config.label}
                </div>
                <div className="px-3 py-1.5 bg-white border border-slate-100 rounded-lg shadow-sm">
                   <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest font-mono">Archive No: {order.order_no}</span>
                </div>
              </div>
              <h3 className="text-4xl font-black text-slate-900 tracking-tight leading-tight uppercase">{order.title}</h3>
           </div>
           
           <button 
            onClick={onClose} 
            className="w-14 h-14 flex items-center justify-center bg-white shadow-xl shadow-slate-900/5 border border-slate-100 hover:bg-rose-50 hover:border-rose-100 rounded-[22px] transition-all group active:scale-95"
           >
              <X size={28} className="text-slate-300 group-hover:text-rose-500 transition-colors" />
           </button>
        </div>
        
        <div className="p-12 overflow-y-auto custom-scrollbar flex-1 space-y-12">
          {/* Metadata Matrix */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <MetadataItem 
              label={t('workflow.fields.node')} 
              value={order.current_node} 
              icon={GitBranch} 
            />
            <MetadataItem 
              label={t('workflow.fields.handler')} 
              value={order.current_assignee_name} 
              icon={User} 
            />
            <MetadataItem 
              label={t('workflow.fields.type')} 
              value={typeConfig.label} 
              icon={typeConfig.icon} 
            />
            <MetadataItem 
              label={t('workflow.fields.time') || 'Timestamp'} 
              value={new Date(order.created_at).toLocaleDateString()} 
              icon={Calendar} 
            />
          </div>
          
          {/* Dynamic Payload */}
          <ApprovalFormPayloadView 
            formData={order.form_data}
            orderType={order.order_type}
          />
        </div>

        {/* Action Bar */}
        <div className="px-12 py-10 border-t border-slate-100 bg-slate-50/80 flex justify-between items-center shrink-0">
           <button
              onClick={() => onVisualize(order.id)}
              className="px-10 py-5 bg-white border border-slate-200 text-slate-900 rounded-[28px] hover:bg-slate-900 hover:text-white transition-all font-black text-[11px] uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-slate-900/5 active:scale-95 group"
            >
              <GitBranch size={18} className="text-indigo-600 group-hover:text-indigo-400 transition-colors" />
              {t('workflow.action.view_flow')}
            </button>
            <div className="flex gap-5 items-center">
              <button 
                onClick={onClose} 
                className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-900 transition-colors"
              >
                {t('common.cancel')}
              </button>
              {order.status === 'pending' && (
                <button
                  onClick={() => onWithdraw(order.id)}
                  disabled={actionLoading}
                  className="px-12 py-5 bg-rose-600 text-white rounded-[32px] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-rose-600/30 hover:bg-rose-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-30"
                >
                  {actionLoading ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <RotateCcw size={18} strokeWidth={3} />
                  )}
                  {t('workflow.action.withdraw')}
                </button>
              )}
            </div>
        </div>
      </motion.div>
    </div>
  );
}
