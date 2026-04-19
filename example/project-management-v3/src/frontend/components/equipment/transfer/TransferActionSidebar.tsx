import React from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Truck, 
  Activity, 
  ClipboardList, 
  Send, 
  PackageSearch, 
  Clock, 
  XCircle, 
  CheckCircle 
} from 'lucide-react'
import { TransferOrder } from '../../../hooks/useTransferDetail'

interface TransferActionSidebarProps {
  order: TransferOrder
  currentUser: any
  onApprove: () => void
  onReject: () => void
  onShip: () => void
  onReceive: () => void
  onCancel: () => void
}

export default function TransferActionSidebar({
  order,
  currentUser,
  onApprove,
  onReject,
  onShip,
  onReceive,
  onCancel
}: TransferActionSidebarProps) {
  const { t, i18n } = useTranslation()

  const isFromManager = currentUser?.employee_id === order.from_manager_id
  const isToManager = currentUser?.employee_id === order.to_manager_id

  return (
    <div className="space-y-6">
      {/* 1. Logistic Summary */}
      <div className="premium-card bg-white p-6 border-none shadow-sm rounded-2xl space-y-6">
        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 leading-none">
          <Truck size={18} className="text-purple-500" />
          {t('equipment.fields.transport_method')}
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-purple-50/50 rounded-2xl border border-purple-100/50">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-lg shadow-sm">
                <Activity size={18} className="text-purple-600" />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">{t('equipment.fields.transport_method')}</p>
                <p className="text-sm font-black text-slate-800 leading-none">
                  {order.transport_method ? t(`equipment.transport_method.${order.transport_method}`) : '-'}
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-1.5 px-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{t('equipment.fields.tracking_no')}</p>
            <p className="text-[11px] font-mono font-black text-slate-700 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100 shadow-inner">
              {order.tracking_no || '-'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Action Center */}
      <div className="premium-card bg-slate-900 p-6 border-none shadow-xl rounded-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
           <ClipboardList size={120} className="text-white" />
        </div>
        
        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2 relative z-10 leading-none">
          <ClipboardList size={16} className="text-blue-400" />
          {t('common.action')}
        </h3>
        
        <div className="space-y-3 relative z-10">
          {order.status === 'pending_from' && isFromManager && (
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={onApprove}
                className="py-3.5 bg-emerald-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 active:scale-95"
              >
                {t('workflow.action.approve')}
              </button>
              <button 
                onClick={onReject}
                className="py-3.5 bg-white/10 text-white/80 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-white/20 transition-all active:scale-95"
              >
                {t('workflow.action.reject')}
              </button>
            </div>
          )}

          {order.status === 'pending_to' && isToManager && (
            <button 
              onClick={onApprove}
              className="w-full py-4 bg-emerald-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/30 active:scale-95"
            >
              {t('workflow.action.approve')}
            </button>
          )}

          {order.status === 'shipping' && isFromManager && (
            <button 
              onClick={onShip}
              className="w-full py-4 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 active:scale-95"
            >
              <Send size={16} />
              {t('equipment.action.ship')}
            </button>
          )}

          {order.status === 'receiving' && isToManager && (
            <button 
              onClick={onReceive}
              className="w-full py-4 bg-emerald-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 active:scale-95"
            >
              <PackageSearch size={16} />
              {t('equipment.action.receive')}
            </button>
          )}

          {['pending_from', 'pending_to', 'shipping'].includes(order.status) && isFromManager && (
            <button 
              onClick={onCancel}
              className="w-full py-3.5 bg-rose-500/10 text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all active:scale-95"
            >
              {t('equipment.action.cancel_transfer')}
            </button>
          )}
        </div>
      </div>

      {/* 3. Lifecycle Timeline */}
      <div className="premium-card bg-white p-7 border-none shadow-sm rounded-2xl space-y-7">
        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 leading-none">
          <Activity size={18} className="text-slate-400" />
          {t('equipment.fields.lifecycle')}
        </h3>
        <div className="space-y-8 relative ml-4 border-l-2 border-slate-50 pl-8 py-2">
          {order.from_approved_at && (
            <div className="relative group">
              <div className="absolute -left-[37px] top-1 w-3.5 h-3.5 rounded-full bg-blue-500 shadow-md border-4 border-blue-50 z-10 group-hover:scale-125 transition-transform" />
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">{new Date(order.from_approved_at).toLocaleString(i18n.language)}</p>
              <p className="text-[11px] font-black text-slate-700 leading-tight">{t('equipment.transfer_status.approved')} (Outbound)</p>
            </div>
          )}
          {order.shipped_at && (
            <div className="relative group">
              <div className="absolute -left-[37px] top-1 w-3.5 h-3.5 rounded-full bg-purple-500 shadow-md border-4 border-purple-50 z-10 group-hover:scale-125 transition-transform" />
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">{new Date(order.shipped_at).toLocaleString(i18n.language)}</p>
              <p className="text-[11px] font-black text-slate-700 leading-tight">{t('equipment.action.ship')}</p>
              <p className="text-[9px] font-bold text-slate-400 mt-1">Ref: {order.shipping_no || '-'}</p>
            </div>
          )}
          {order.received_at && (
            <div className="relative group">
              <div className="absolute -left-[37px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-md border-4 border-emerald-50 z-10 group-hover:scale-125 transition-transform" />
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">{new Date(order.received_at).toLocaleString(i18n.language)}</p>
              <p className="text-[11px] font-black text-slate-700 leading-tight">{t('equipment.action.receive')}</p>
              <div className="mt-1.5 flex items-center gap-2">
                 <span className="text-[8px] font-black uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{order.receive_status || 'Normal'}</span>
              </div>
            </div>
          )}
          
          {/* Apply Status */}
          <div className="relative group opacity-60">
             <div className="absolute -left-[37px] top-1 w-3.5 h-3.5 rounded-full bg-slate-200 shadow-sm border-4 border-white z-10" />
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">{new Date(order.created_at).toLocaleString(i18n.language)}</p>
             <p className="text-[11px] font-black text-slate-500 leading-tight">{t('workflow.action.initiate')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
