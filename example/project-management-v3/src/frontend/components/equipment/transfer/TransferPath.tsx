import React from 'react'
import { useTranslation } from 'react-i18next'
import { MapPin, ArrowRight, User } from 'lucide-react'
import { TransferOrder } from '../../../hooks/useTransferDetail'

interface TransferPathProps {
  order: TransferOrder
}

export default function TransferPath({ order }: TransferPathProps) {
  const { t } = useTranslation()

  return (
    <div className="premium-card bg-white p-8 border-none shadow-sm rounded-2xl space-y-8">
      {/* Transfer Path Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <MapPin size={12} className="text-amber-500" />
            {t('equipment.fields.from_location')}
          </p>
          <p className="text-lg font-black text-slate-800 truncate leading-none">
            {order.from_warehouse_name || order.from_project_name}
          </p>
          <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 bg-white w-fit px-2 py-1 rounded shadow-sm">
            <User size={10} className="text-slate-300" />
            {t('equipment.fields.keeper')}: <span className="text-slate-600">{order.from_manager || '-'}</span>
          </p>
        </div>

        <div className="flex flex-col items-center">
          <div className="h-0.5 w-full bg-slate-200 relative flex items-center justify-center">
            <div className="absolute w-2 h-2 rounded-full bg-slate-200" />
            <div className="bg-white p-1 rounded-full border border-slate-100 shadow-sm z-10">
              <ArrowRight className="text-blue-500" size={16} />
            </div>
          </div>
          <p className="text-[9px] font-black text-blue-500 mt-2 uppercase tracking-tighter bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
            {t(`equipment.transfer_type.${order.transfer_type}`)}
          </p>
        </div>

        <div className="space-y-2 md:text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 md:justify-end">
            <MapPin size={12} className="text-emerald-500" />
            {t('equipment.fields.to_location')}
          </p>
          <p className="text-lg font-black text-slate-800 truncate leading-none">
            {order.to_warehouse_name || order.to_project_name}
          </p>
          <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 bg-white w-fit px-2 py-1 rounded shadow-sm md:ml-auto">
            <User size={10} className="text-slate-300" />
            {t('equipment.fields.keeper')}: <span className="text-slate-600">{order.to_manager || '-'}</span>
          </p>
        </div>
      </div>

      {/* Rationale and Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-4 w-1 bg-blue-500 rounded-full" />
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('equipment.fields.transfer_scene')}</h3>
          </div>
          <div className="p-4 bg-blue-50/30 rounded-xl border border-blue-50 transition-all hover:bg-white hover:shadow-sm">
             <p className="text-sm font-black text-blue-700">
                {t(`equipment.transfer_scene.${order.transfer_scene}`)}
             </p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-4 w-1 bg-amber-500 rounded-full" />
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('equipment.fields.reason')}</h3>
          </div>
          <div className="p-4 bg-amber-50/20 rounded-xl border border-amber-50 transition-all hover:bg-white hover:shadow-sm">
             <p className="text-sm font-medium text-slate-600 italic">
                {order.transfer_reason || t('personnel.empty.no_content')}
             </p>
          </div>
        </div>
      </div>
    </div>
  )
}
