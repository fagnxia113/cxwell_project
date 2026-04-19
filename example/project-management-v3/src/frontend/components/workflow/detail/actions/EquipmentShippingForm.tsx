import React from 'react'
import { Camera, X } from 'lucide-react'
import { useImageUpload } from '../../../../hooks/useImageUpload'

interface EquipmentShippingFormProps {
  shippedAt: string
  setShippedAt: (val: string) => void
  shippingNo: string
  setShippingNo: (val: string) => void
  shippingAttachment: string
  setShippingAttachment: (val: string) => void
  shippingItemImages: Record<string, string[]>
  setShippingItemImages: (val: any) => void
  shippingPackageImages: string[]
  setShippingPackageImages: (val: string[]) => void
  items: any[]
  t: any
}

export const EquipmentShippingForm: React.FC<EquipmentShippingFormProps> = ({
  shippedAt, setShippedAt,
  shippingNo, setShippingNo,
  shippingAttachment, setShippingAttachment,
  shippingItemImages, setShippingItemImages,
  shippingPackageImages, setShippingPackageImages,
  items,
  t
}) => {
  const { uploadImages } = useImageUpload()

  const handleItemImageUpload = async (itemId: string, files: FileList | null) => {
    if (!files) return
    const urls = await uploadImages(files)
    setShippingItemImages((prev: any) => ({
      ...prev,
      [itemId]: [...(prev[itemId] || []), ...urls]
    }))
  }

  const handlePackageImageUpload = async (files: FileList | null) => {
    if (!files) return
    const urls = await uploadImages(files)
    setShippingPackageImages([...shippingPackageImages, ...urls])
  }

  return (
    <div className="mb-6 p-5 bg-blue-50/50 rounded-xl border border-blue-100 shadow-inner">
      <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
        <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
        {t('workflow.fields.shipping_info')}
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t('workflow.fields.shipping_date')} <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            value={shippedAt}
            onChange={(e) => setShippedAt(e.target.value)}
            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t('workflow.fields.shipping_no')}
          </label>
          <input
            type="text"
            value={shippingNo}
            onChange={(e) => setShippingNo(e.target.value)}
            placeholder={t('workflow.placeholder.shipping_no')}
            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {t('workflow.fields.shipping_note')}
          </label>
          <textarea
            value={shippingAttachment}
            onChange={(e) => setShippingAttachment(e.target.value)}
            placeholder={t('workflow.placeholder.shipping_note')}
            rows={2}
            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Item Image Upload */}
      {items.length > 0 && (
        <div className="space-y-4 mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">
            {t('workflow.fields.item_images')}
          </label>
          <div className="grid gap-3">
            {items.map((item, idx) => (
              <div key={item.id || idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900">{item.equipment_name}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{item.model_no}</span>
                  </div>
                  <div className="text-xs text-gray-500">{item.quantity} {item.unit}</div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {(shippingItemImages[item.id] || []).map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} className="w-14 h-14 object-cover rounded-lg border shadow-sm" alt="" />
                      <button 
                        onClick={() => setShippingItemImages((prev: any) => ({ ...prev, [item.id]: prev[item.id].filter((_:any, idx:number) => idx !== i) }))}
                        className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <label className="w-14 h-14 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                    <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleItemImageUpload(item.id, e.target.files)} />
                    <Camera className="w-5 h-5 text-gray-400" />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Package Image Upload */}
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-3">
          {t('workflow.fields.package_images')}
        </label>
        <div className="flex flex-wrap gap-3">
          {shippingPackageImages.map((url, idx) => (
            <div key={idx} className="relative group">
              <img src={url} className="w-20 h-20 object-cover rounded-xl border-2 border-white shadow-md" alt="" />
              <button 
                onClick={() => setShippingPackageImages(shippingPackageImages.filter((_, i) => i !== idx))}
                className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-white transition-all">
            <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handlePackageImageUpload(e.target.files)} />
            <Camera className="w-6 h-6 text-gray-400" />
          </label>
        </div>
      </div>
    </div>
  )
}
