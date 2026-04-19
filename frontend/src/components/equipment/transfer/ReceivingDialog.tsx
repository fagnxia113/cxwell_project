import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { XCircle, PackageSearch, ImageIcon, Plus, Trash2, AlertCircle } from 'lucide-react'
import { TransferOrder } from '../../../hooks/useTransferDetail'

interface ReceivingDialogProps {
  order: TransferOrder
  onConfirm: (data: any) => Promise<boolean>
  onClose: () => void
  onImageUpload: (file: File) => Promise<string | null>
}

export default function ReceivingDialog({ order, onConfirm, onClose, onImageUpload }: ReceivingDialogProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  
  const [receivingData, setReceivingData] = useState({
    received_at: new Date().toISOString().split('T')[0],
    receive_status: 'normal' as 'normal' | 'damaged' | 'missing' | 'partial' | 'exception',
    receive_comment: '',
    item_images: [] as { item_id: string; images: string[] }[],
    package_images: [] as string[],
    received_items: order.items.map(item => ({
      item_id: item.id,
      received_quantity: item.quantity
    }))
  })

  // Status mapping
  const statusOptions: { value: string; label: string; color: string }[] = [
    { value: 'normal', label: t('equipment.receive_status.normal'), color: 'emerald' },
    { value: 'damaged', label: t('equipment.receive_status.damaged'), color: 'rose' },
    { value: 'missing', label: t('equipment.receive_status.missing'), color: 'amber' },
    { value: 'partial', label: t('equipment.receive_status.partial'), color: 'blue' },
    { value: 'exception', label: t('equipment.receive_status.exception'), color: 'indigo' }
  ]

  const handleFiles = async (files: FileList | null, itemId?: string) => {
    if (!files) return
    const urls: string[] = []
    for (let i = 0; i < files.length; i++) {
      const url = await onImageUpload(files[i])
      if (url) urls.push(url)
    }

    if (itemId) {
      setReceivingData(prev => {
        const existing = prev.item_images.find(img => img.item_id === itemId)
        if (existing) {
          return {
            ...prev,
            item_images: prev.item_images.map(img => 
              img.item_id === itemId ? { ...img, images: [...img.images, ...urls] } : img
            )
          }
        }
        return {
          ...prev,
          item_images: [...prev.item_images, { item_id: itemId, images: urls }]
        }
      })
    } else {
      setReceivingData(prev => ({
        ...prev,
        package_images: [...prev.package_images, ...urls]
      }))
    }
  }

  const removeImage = (index: number, itemId?: string) => {
    if (itemId) {
      setReceivingData(prev => ({
        ...prev,
        item_images: prev.item_images.map(img => 
          img.item_id === itemId ? { ...img, images: img.images.filter((_, i) => i !== index) } : img
        )
      }))
    } else {
      setReceivingData(prev => ({
        ...prev,
        package_images: prev.package_images.filter((_, i) => i !== index)
      }))
    }
  }

  const handleConfirm = async () => {
    setLoading(true)
    const success = await onConfirm(receivingData)
    if (success) onClose()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full mx-4 space-y-8 max-h-[90vh] overflow-y-auto custom-scrollbar border border-white/20">
        <div className="flex items-center justify-between sticky top-0 bg-white z-10 pb-4 border-b border-slate-50">
           <div className="flex items-center gap-3">
              <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600">
                <PackageSearch size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">{t('equipment.action.receive')}</h3>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-300 hover:text-slate-600">
             <XCircle size={28} />
           </button>
        </div>

        {/* Global Status */}
        <div className="space-y-4">
           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('equipment.fields.receive_status')}</label>
           <div className="grid grid-cols-5 gap-2">
              {statusOptions.map(opt => (
                <button 
                  key={opt.value}
                  onClick={() => setReceivingData({...receivingData, receive_status: opt.value as any})}
                  className={`py-3.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-tighter transition-all ${
                    receivingData.receive_status === opt.value
                    ? `bg-${opt.color}-50 border-${opt.color}-500 text-${opt.color}-600 shadow-sm`
                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
           </div>
        </div>

        <div className="space-y-1.5 flex flex-col">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('common.remark')}</label>
          <textarea 
            rows={2}
            placeholder={t('personnel.placeholder.remark')}
            value={receivingData.receive_comment}
            onChange={e => setReceivingData({...receivingData, receive_comment: e.target.value})}
            className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-emerald-500 rounded-xl outline-none text-sm font-bold shadow-inner transition-all placeholder:text-slate-300 resize-none"
          />
        </div>

        {/* Package Images */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <ImageIcon size={14} className="text-emerald-500" />
            {t('equipment.fields.package_images')}
          </label>
          <div className="grid grid-cols-4 gap-4">
            {receivingData.package_images.map((url, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-slate-100 relative group overflow-hidden border border-slate-200 shadow-sm">
                <img src={url} className="w-full h-full object-cover" alt="Package Condition" />
                <button onClick={() => removeImage(i)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><Trash2 size={12} /></button>
              </div>
            ))}
            <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:border-emerald-400 hover:bg-emerald-50/20 transition-all cursor-pointer group">
              <Plus size={20} className="text-slate-200 group-hover:text-emerald-500 group-hover:scale-110 transition-all" />
              <input type="file" multiple accept="image/*" className="hidden" onChange={e => handleFiles(e.target.files)} />
            </label>
          </div>
        </div>

        {/* Granular Item Verification */}
        <div className="space-y-4 pt-4 border-t border-slate-50">
           <div className="flex items-center gap-2">
             <AlertCircle size={14} className="text-emerald-500" />
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('equipment.item_delivery_verification')}</label>
           </div>
           <div className="space-y-6">
             {order.items.map(item => {
               const itemImg = receivingData.item_images.find(img => img.item_id === item.id)
               const ri = receivingData.received_items.find(ri => ri.item_id === item.id)
               
               return (
                 <div key={item.id} className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4 transition-all hover:bg-white hover:shadow-md">
                    <div className="flex items-center justify-between">
                       <div className="space-y-0.5">
                          <p className="text-xs font-black text-slate-900 uppercase leading-none">{item.equipment_name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{t('equipment.fields.shipping_qty')}: {item.quantity} {item.unit}</p>
                       </div>
                       
                       <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{t('equipment.fields.receive_qty')}</label>
                          <input 
                            type="number"
                            min={0}
                            max={item.quantity}
                            value={ri?.received_quantity}
                            onChange={(e) => {
                               const val = parseInt(e.target.value) || 0
                               setReceivingData(prev => ({
                                  ...prev,
                                  received_items: prev.received_items.map(r => 
                                     r.item_id === item.id ? {...r, received_quantity: val} : r
                                  )
                               }))
                            }}
                            className="w-16 bg-transparent text-sm font-black text-emerald-600 outline-none text-right"
                          />
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-3">
                      {itemImg?.images.map((url, i) => (
                        <div key={i} className="aspect-square rounded-xl bg-white relative group overflow-hidden border border-slate-100 shadow-sm">
                          <img src={url} className="w-full h-full object-cover" alt="Received Condition" />
                          <button onClick={() => removeImage(i, item.id)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={10} /></button>
                        </div>
                      ))}
                      <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center hover:border-emerald-400 hover:bg-emerald-50 transition-all cursor-pointer text-slate-200 hover:text-emerald-500">
                        <Plus size={16} />
                        <input type="file" multiple accept="image/*" className="hidden" onChange={e => handleFiles(e.target.files, item.id)} />
                      </label>
                    </div>
                 </div>
               )
             })}
           </div>
        </div>

        <div className="flex gap-4 pt-4 sticky bottom-0 bg-white">
          <button onClick={onClose} className="flex-1 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all">{t('common.cancel')}</button>
          <button 
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 hover:bg-emerald-700 active:scale-95 transition-all"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <PackageSearch size={16} />}
            {t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
