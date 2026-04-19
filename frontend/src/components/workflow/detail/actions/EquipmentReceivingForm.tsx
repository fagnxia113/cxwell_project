import React from 'react'
import { Camera, X, AlertCircle } from 'lucide-react'
import { useImageUpload } from '../../../../hooks/useImageUpload'

interface EquipmentReceivingFormProps {
  receivedAt: string
  setReceivedAt: (val: string) => void
  receiveStatus: 'normal' | 'exception'
  setReceiveStatus: (val: 'normal' | 'exception') => void
  receiveComment: string
  setReceiveComment: (val: string) => void
  receivingItemQuantities: Record<string, number>
  setReceivingItemQuantities: (val: any) => void
  receivingItemImages: Record<string, string[]>
  setReceivingItemImages: (val: any) => void
  receivingPackageImages: string[]
  setReceivingPackageImages: (val: string[]) => void
  transferOrder: any
  t: any
}

export const EquipmentReceivingForm: React.FC<EquipmentReceivingFormProps> = ({
  receivedAt, setReceivedAt,
  receiveStatus, setReceiveStatus,
  receiveComment, setReceiveComment,
  receivingItemQuantities, setReceivingItemQuantities,
  receivingItemImages, setReceivingItemImages,
  receivingPackageImages, setReceivingPackageImages,
  transferOrder,
  t
}) => {
  const { uploadImages } = useImageUpload()

  const handleItemImageUpload = async (itemId: string, files: FileList | null) => {
    if (!files) return
    const urls = await uploadImages(files)
    setReceivingItemImages((prev: any) => ({
      ...prev,
      [itemId]: [...(prev[itemId] || []), ...urls]
    }))
  }

  const handlePackageImageUpload = async (files: FileList | null) => {
    if (!files) return
    const urls = await uploadImages(files)
    setReceivingPackageImages([...receivingPackageImages, ...urls])
  }

  const items = transferOrder?.items || []

  return (
    <div className="mb-6 p-5 bg-emerald-50/50 rounded-xl border border-emerald-100 shadow-inner">
      <h4 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
        <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
        {t('workflow.action.receive')}
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t('workflow.fields.receiving_time')} <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            value={receivedAt}
            onChange={(e) => setReceivedAt(e.target.value)}
            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t('workflow.fields.receive_status')} <span className="text-rose-500">*</span>
          </label>
          <select
            value={receiveStatus}
            onChange={(e) => setReceiveStatus(e.target.value as any)}
            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          >
            <option value="normal">{t('workflow.status.normal_receiving')}</option>
            <option value="exception">{t('workflow.status.exception_receiving')}</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t('workflow.fields.receive_note')} {receiveStatus === 'exception' && <span className="text-rose-500">*</span>}
          </label>
          <textarea
            value={receiveComment}
            onChange={(e) => setReceiveComment(e.target.value)}
            placeholder={t('workflow.placeholder.receive_note')}
            rows={2}
            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {receiveStatus === 'exception' && (
        <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-700">
            {t('workflow.message.exception_receiving_hint')}
          </div>
        </div>
      )}

      {/* Itemized Receiving Details */}
      <div className="space-y-4 mb-6">
        {items.map((item: any) => {
          const itemId = item.id || item.equipment_id;
          return (
            <div key={itemId} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="font-bold text-gray-900">{item.equipment_name}</div>
                  <div className="text-xs text-gray-500">{t('workflow.fields.shipping_quantity')}: {item.quantity}</div>
                </div>
                
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-2">
                     <span className="text-sm text-gray-600">{t('workflow.fields.received_quantity')}:</span>
                     <input
                       type="number"
                       value={receivingItemQuantities[itemId] ?? item.quantity}
                       onChange={(e) => setReceivingItemQuantities((prev: any) => ({ ...prev, [itemId]: Number(e.target.value) }))}
                       className="w-20 px-3 py-1 border border-gray-200 rounded text-center focus:ring-2 focus:ring-emerald-500"
                     />
                   </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {(receivingItemImages[itemId] || []).map((url: string, i: number) => (
                  <div key={i} className="relative group">
                    <img src={url} className="w-14 h-14 object-cover rounded-lg border" alt="" />
                    <button 
                      onClick={() => setReceivingItemImages((prev: any) => ({ ...prev, [itemId]: prev[itemId].filter((_:any, idx:number) => idx !== i) }))}
                      className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 shadow-lg"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <label className="w-14 h-14 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50">
                  <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleItemImageUpload(itemId, e.target.files)} />
                  <Camera className="w-5 h-5 text-gray-400" />
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {/* Package Image Upload */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-3">
          {t('workflow.fields.receiving_package_images')}
        </label>
        <div className="flex flex-wrap gap-3">
          {receivingPackageImages.map((url, idx) => (
            <div key={idx} className="relative group">
              <img src={url} className="w-20 h-20 object-cover rounded-xl border-2 border-white shadow-md" alt="" />
              <button 
                onClick={() => setReceivingPackageImages(receivingPackageImages.filter((_, i) => i !== idx))}
                className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 shadow-lg"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-white">
            <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handlePackageImageUpload(e.target.files)} />
            <Camera className="w-6 h-6 text-gray-400" />
          </label>
        </div>
      </div>
    </div>
  )
}
