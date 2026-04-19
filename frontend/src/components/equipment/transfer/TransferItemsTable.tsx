import React from 'react'
import { useTranslation } from 'react-i18next'
import { Boxes, Plus } from 'lucide-react'
import { TransferItem } from '../../../hooks/useTransferDetail'

interface TransferItemsTableProps {
  items: TransferItem[]
}

export default function TransferItemsTable({ items }: TransferItemsTableProps) {
  const { t } = useTranslation()

  return (
    <div className="premium-card bg-white border-none shadow-sm rounded-2xl overflow-hidden flex flex-col">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
        <h3 className="text-[10px] font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest leading-none">
          <Boxes size={18} className="text-blue-500" />
          {t('equipment.item_list')}
          <span className="text-[9px] bg-blue-100 text-blue-600 px-2.5 py-1 rounded-full ml-2 font-black border border-blue-200 shadow-sm">
            {items.length} {t('common.records')}
          </span>
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">{t('equipment.fields.name')}</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">{t('equipment.fields.model')}</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">{t('equipment.fields.manage_code')}</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-100">{t('equipment.fields.quantity')}</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">{t('equipment.fields.status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.map((item) => (
              <React.Fragment key={item.id}>
                <tr className="hover:bg-slate-50/30 transition-all group">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <p className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight mb-0.5">{item.equipment_name}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter bg-slate-100/50 w-fit px-1.5 py-0.5 rounded border border-slate-100">
                        {item.brand}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[11px] font-black text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg shadow-inner">
                      {item.model_no}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="font-mono text-[10px] font-bold text-slate-400">
                      {item.manage_code || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-sm font-black text-slate-900 tabular-nums">{item.quantity}</span>
                    <span className="text-[10px] font-bold text-slate-400 ml-1.5 uppercase">{item.unit}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-[9px] font-black text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full w-fit uppercase tracking-wider shadow-sm">
                      {item.status}
                    </div>
                  </td>
                </tr>
                
                {/* Embedded Accessories */}
                {item.accessories && item.accessories.length > 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-0 pb-6">
                      <div className="ml-4 p-5 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-4 shadow-inner">
                        <div className="flex items-center justify-between">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <Plus size={12} className="text-blue-500" />
                              {t('equipment.accessory_mgmt')}
                           </p>
                           <span className="text-[8px] font-black text-slate-300 uppercase italic">Linked Components</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {item.accessories.map(acc => (
                            <div key={acc.id} className="flex flex-col p-3.5 bg-white rounded-xl border border-slate-200/60 shadow-sm relative overflow-hidden group/acc hover:border-blue-200 transition-all">
                              <div className="flex justify-between items-start mb-1.5">
                                <span className="text-[11px] font-black text-slate-800 truncate pr-8 group-hover/acc:text-blue-700 transition-colors uppercase leading-none">{acc.accessory_name}</span>
                                {acc.is_required && (
                                  <span className="absolute top-0 right-0 px-2 py-0.5 bg-rose-500 text-white text-[8px] font-black uppercase rounded-bl shadow-sm">
                                    Req
                                  </span>
                                )}
                              </div>
                              <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                                <span className="truncate pr-4">{acc.accessory_model}</span>
                                <span className="font-black text-slate-900 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">x{acc.accessory_quantity}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        
        {items.length === 0 && (
          <div className="py-20 text-center space-y-3">
             <Boxes className="mx-auto text-slate-200" size={48} />
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Items Loaded</p>
          </div>
        )}
      </div>
    </div>
  )
}
