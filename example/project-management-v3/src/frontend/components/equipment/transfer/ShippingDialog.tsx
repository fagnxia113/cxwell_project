import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { XCircle, Send, ImageIcon, Plus, Trash2 } from 'lucide-react'
import { TransferOrder } from '../../../hooks/useTransferDetail'

interface ShippingDialogProps {
  order: TransferOrder
  onConfirm: (data: any) => Promise<boolean>
  onClose: () => void
  onImageUpload: (file: File) => Promise<string | null>
}

export default function ShippingDialog({ order, onConfirm, onClose, onImageUpload }: ShippingDialogProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [shippingData, setShippingData] = useState({
    shipped_at: new Date().toISOString().split('T')[0],
    shipping_no: '',
    shipping_attachment: '',
    item_images: [] as { item_id: string; images: string[] }[],
    package_images: [] as string[]
  })

  const handleFiles = async (files: FileList | null, itemId?: string) => {
    if (!files) return
    const urls: string[] = []
    for (let i = 0; i < files.length; i++) {
      const url = await onImageUpload(files[i])
      if (url) urls.push(url)
    }

    if (itemId) {
      setShippingData(prev => {
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
      setShippingData(prev => ({
        ...prev,
        package_images: [...prev.package_images, ...urls]
      }))
    }
  }

  const removeImage = (index: number, itemId?: string) => {
    if (itemId) {
      setShippingData(prev => ({
        ...prev,
        item_images: prev.item_images.map(img => 
          img.item_id === itemId ? { ...img, images: img.images.filter((_, i) => i !== index) } : img
        )
      }))
    } else {
      setShippingData(prev => ({
        ...prev,
        package_images: prev.package_images.filter((_, i) => i !== index)
      }))
    }
  }

  const handleConfirm = async () => {
    setLoading(true)
    const success = await onConfirm(shippingData)
    if (success) onClose()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full mx-4 space-y-8 max-h-[90vh] overflow-y-auto custom-scrollbar border border-white/20">
        <div className="flex items-center justify-between sticky top-0 bg-white z-10 pb-4 border-b border-slate-50">
          <div className="flex items-center gap-3">
             <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
               <Send size={20} />
             </div>
             <h3 className="text-xl font-black text-slate-900 tracking-tight">{t('equipment.action.ship')}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-300 hover:text-slate-600">
            <XCircle size={28} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-1.5 flex flex-col">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('equipment.fields.shipping_date')}</label>
            <input 
              type="date" 
              value={shippingData.shipped_at}
              onChange={e => setShippingData({...shippingData, shipped_at: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-xl outline-none text-sm font-bold shadow-inner transition-all"
            />
          </div>
          <div className="space-y-1.5 flex flex-col">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{t('equipment.fields.shipping_no')}</label>
            <input 
              type="text" 
              placeholder="e.g. SHIP-88273"
              value={shippingData.shipping_no}
              onChange={e => setShippingData({...shippingData, shipping_no: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-xl outline-none text-sm font-bold shadow-inner transition-all placeholder:text-slate-300"
            />
          </div>
        </div>

        {/* Package Images */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <ImageIcon size={14} className="text-blue-500" />
            {t('equipment.fields.package_images')}
          </label>
          <div className="grid grid-cols-4 gap-4">
            {shippingData.package_images.map((url, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-slate-100 relative group overflow-hidden border border-slate-200">
                <img src={url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Package" />
                <button onClick={() => removeImage(i)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
              </div>
            ))}
            <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group">
              <Plus size={20} className="text-slate-300 group-hover:text-blue-500 group-hover:scale-110 transition-all" />
              <span className="text-[8px] font-black text-slate-300 uppercase group-hover:text-blue-400">{t('common.upload')}</span>
              <input type="file" multiple accept="image/*" className="hidden" onChange={e => handleFiles(e.target.files)} />
            </label>
          </div>
        </div>

        {/* Item Specific Images */}
        <div className="space-y-4 pt-4 border-t border-slate-50">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('equipment.item_images')}</label>
          <div className="space-y-6">
            {order.items.map(item => {
              const itemImg = shippingData.item_images.find(img => img.item_id === item.id)
              return (
                <div key={item.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                     <p className="text-xs font-black text-slate-900 uppercase">
                        {item.equipment_name} <span className="text-blue-500 ml-1">x{item.quantity}</span>
                     </p>
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    {itemImg?.images.map((url, i) => (
                      <div key={i} className="aspect-square rounded-xl bg-white relative group overflow-hidden border border-slate-100 shadow-sm">
                        <img src={url} className="w-full h-full object-cover" alt="Item" />
                        <button onClick={() => removeImage(i, item.id)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={10} /></button>
                      </div>
                    ))}
                    <label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center hover:border-blue-400 hover:bg-white transition-all cursor-pointer text-slate-300 hover:text-blue-500">
                      <Plus size={16} />
                      <input type="file" multiple accept="image/*" className="hidden" onChange={e => handleFiles(e.target.files, item.id)} />
                    </label>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button onClick={onClose} className="flex-1 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all">{t('common.cancel')}</button>
          <button 
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-4 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Send size={16} />}
            {t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
