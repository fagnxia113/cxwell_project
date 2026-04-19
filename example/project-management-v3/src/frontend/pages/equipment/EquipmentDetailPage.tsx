import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Activity, AlertCircle } from 'lucide-react'
import { useConfirm } from '../../hooks/useConfirm'

// Custom Hooks
import { useEquipmentDetail, Accessory } from '../../hooks/useEquipmentDetail'

// Sub-components
import EquipmentHeader from '../../components/equipment/detail/EquipmentHeader'
import EquipmentVisuals from '../../components/equipment/detail/EquipmentVisuals'
import EquipmentStatusBoard from '../../components/equipment/detail/EquipmentStatusBoard'
import EquipmentDetailsTabs from '../../components/equipment/detail/EquipmentDetailsTabs'
import AccessoryRegistry from '../../components/equipment/detail/AccessoryRegistry'
import { BindAccessoryModal, UnbindAccessoryModal } from '../../components/equipment/detail/AccessoryLinkModals'

/**
 * 设备详情页 (重构版)
 * 核心设计：Hook 驱动的资产技术档案管理 + 逻辑解耦的子组件
 */
export default function EquipmentDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const { confirm } = useConfirm()

  const {
    equipment,
    images,
    loading,
    uploading,
    isAdmin,
    availableAccessories,
    loadingAccessories,
    actionLoading,
    uploadImages,
    deleteImage,
    loadAvailableAccessories,
    bindAccessory,
    unbindAccessory,
    deleteEquipment
  } = useEquipmentDetail(id)

  // Local UI States
  const [activeTab, setActiveTab] = useState<'specs' | 'lifecycle' | 'accessories'>('specs')
  const [showBindModal, setShowBindModal] = useState(false)
  const [selectedUnbindAcc, setSelectedUnbindAcc] = useState<Accessory | null>(null)

  // 处理删除设备
  const handleDelete = async () => {
    if (!(await confirm({ 
      title: t('equipment.action.confirm_delete'), 
      content: t('equipment.action.delete_desc'), 
      type: 'danger' 
    }))) return
    
    const success = await deleteEquipment()
    if (success) window.history.back()
  }

  // 处理图片删除确认
  const handleImageDelete = async (imageId: string) => {
    if (!(await confirm({ 
      title: t('common.delete'), 
      content: t('equipment.action.delete_desc'), 
      type: 'danger' 
    }))) return
    await deleteImage(imageId)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Activity className="text-indigo-600 animate-spin" size={48} />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Technical Archive...</p>
      </div>
    )
  }

  if (!equipment) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center text-center">
        <div className="premium-card p-12 max-w-sm bg-white border-none shadow-sm rounded-[40px]">
          <AlertCircle size={64} className="text-rose-500 mx-auto mb-6 opacity-20" />
          <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight mb-2">{t('equipment.empty.no_equipment')}</h2>
          <p className="text-sm font-medium text-slate-400 mb-8 px-4">The requested asset could not be located in the ledger.</p>
          <button 
            onClick={() => window.history.back()} 
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-black transition-all"
          >
            {t('common.back')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8 space-y-10 animate-fade-in custom-scrollbar pb-24">
      
      {/* 1. 顶部标题与核心操作 */}
      <EquipmentHeader 
        equipment={equipment} 
        isAdmin={isAdmin} 
        onDelete={handleDelete} 
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start max-w-7xl mx-auto">
        
        {/* 左侧：视觉资料与核心状态 */}
        <div className="xl:col-span-4 space-y-8">
           <EquipmentVisuals 
             images={images}
             uploading={uploading}
             onUpload={async (files) => {
               const res = await uploadImages(files)
               return !!res
             }}
             onDelete={handleImageDelete}
           />
           <EquipmentStatusBoard equipment={equipment} />
        </div>

        {/* 右侧：技术细节与关联配件 */}
        <div className="xl:col-span-8 space-y-8">
           <EquipmentDetailsTabs 
             equipment={equipment}
             activeTab={activeTab}
             onTabChange={(tab) => setActiveTab(tab as any)}
           />

           {/* 配件注册表 (仅在配件 Tab 或下方显示) */}
           {activeTab === 'accessories' && (
             <AccessoryRegistry 
               accessories={equipment.accessories}
               onBind={() => {
                 loadAvailableAccessories()
                 setShowBindModal(true)
               }}
               onUnbind={setSelectedUnbindAcc}
             />
           )}
        </div>
      </div>

      {/* 弹窗层：解耦管理 */}
      <BindAccessoryModal 
        isOpen={showBindModal}
        loading={loadingAccessories}
        accessories={availableAccessories}
        actionLoading={actionLoading}
        onClose={() => setShowBindModal(false)}
        onConfirm={async (accId, qty) => {
          const success = await bindAccessory(accId, qty)
          if (success) setShowBindModal(false)
        }}
      />

      <UnbindAccessoryModal 
        accessory={selectedUnbindAcc}
        actionLoading={actionLoading}
        onClose={() => setSelectedUnbindAcc(null)}
        onConfirm={async (qty) => {
          if (!selectedUnbindAcc) return
          const success = await unbindAccessory(selectedUnbindAcc.id, qty)
          if (success) setSelectedUnbindAcc(null)
        }}
      />

    </div>
  )
}
