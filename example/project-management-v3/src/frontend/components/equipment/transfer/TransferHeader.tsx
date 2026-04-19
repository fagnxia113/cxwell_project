import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Clock, CheckCircle, XCircle, Truck, PackageSearch, AlertTriangle, FileText, Calendar } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { TransferOrder } from '../../../hooks/useTransferDetail'

interface TransferHeaderProps {
  order: TransferOrder
}

export default function TransferHeader({ order }: TransferHeaderProps) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const getStatusBadge = (status: string) => {
    const config: any = {
      'pending_from': { label: t('equipment.transfer_status.pending_from'), color: 'amber', icon: Clock },
      'pending_to': { label: t('equipment.transfer_status.pending_to'), color: 'orange', icon: Clock },
      'rejected': { label: t('workflow.status.rejected'), color: 'rose', icon: XCircle },
      'shipping': { label: t('equipment.transfer_status.shipping'), color: 'blue', icon: Truck },
      'receiving': { label: t('equipment.transfer_status.receiving'), color: 'indigo', icon: PackageSearch },
      'completed': { label: t('equipment.transfer_status.completed'), color: 'emerald', icon: CheckCircle },
      'cancelled': { label: t('equipment.transfer_status.cancelled'), color: 'slate', icon: AlertTriangle }
    }
    const current = config[status] || { label: status, color: 'slate', icon: FileText }
    const Icon = current.icon
    
    return (
      <div className={cn(
        "px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1.5 border uppercase tracking-wider shadow-sm",
        current.color === 'amber' ? "bg-amber-50 text-amber-600 border-amber-100" :
        current.color === 'orange' ? "bg-orange-50 text-orange-600 border-orange-100" :
        current.color === 'rose' ? "bg-rose-50 text-rose-600 border-rose-100" :
        current.color === 'blue' ? "bg-blue-50 text-blue-600 border-blue-100" :
        current.color === 'indigo' ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
        current.color === 'emerald' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
        "bg-slate-50 text-slate-500 border-slate-200"
      )}>
        <Icon size={12} />
        {current.label}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all text-slate-400 hover:text-slate-900 group flex items-center gap-2"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">{t('common.back')}</span>
        </button>

        <div className="flex items-center gap-3">
          <button className="px-6 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest shadow-sm">
            {t('common.print')}
          </button>
        </div>
      </div>

      <div className="premium-card bg-white p-8 border-none shadow-sm rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{order.order_no}</h1>
              {getStatusBadge(order.status)}
            </div>
            <p className="text-[11px] font-bold text-slate-400 flex items-center gap-2 uppercase tracking-wide">
              <Calendar size={14} className="text-blue-500" />
              {t('workflow.fields.created_at')}: {new Date(order.created_at).toLocaleString(i18n.language)}
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-50 px-5 py-3 rounded-xl border border-slate-100">
             <div className="text-center border-r border-slate-200 pr-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">{t('equipment.fields.total_items')}</p>
                <p className="text-lg font-black text-slate-900 leading-tight">{order.items.length}</p>
             </div>
             <div className="text-center pl-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">{t('equipment.fields.apply_date')}</p>
                <p className="text-sm font-bold text-slate-700">{new Date(order.apply_date).toLocaleDateString()}</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
