import React, { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Activity, AlertCircle } from 'lucide-react'
import { useConfirm } from '../../hooks/useConfirm'

// Custom Hooks
import { useAccessoryDetail } from '../../hooks/useAccessoryDetail'

// Sub-components
import AccessoryHeader from '../../components/equipment/accessory/AccessoryHeader'
import AccessoryProfileCard from '../../components/equipment/accessory/AccessoryProfileCard'
import AccessorySpecsTable from '../../components/equipment/accessory/AccessorySpecsTable'
import AccessoryMediaGrid from '../../components/equipment/accessory/AccessoryMediaGrid'
import AccessoryConnectivitySidebar from '../../components/equipment/accessory/AccessoryConnectivitySidebar'
import { BindHostModal, UnbindHostModal } from '../../components/equipment/accessory/HostLinkModals'

/**
 * 配件详情�?(重构�?
 * 核心设计：Hook 驱动的档案管�?+ 逻辑解耦的子组�? */
const AccessoryDetailPage: React.FC = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const { confirm } = useConfirm()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    accessory,
    images,
    loading,
    uploading,
    actionLoading,
    isEditing,
    editForm,
    availableEquipment,
    loadingEquip,
    setEditForm,
    startEditing,
    cancelEditing,
    saveChanges,
    uploadImages,
    deleteImage,
    loadAvailableHosts,
    bindToHost,
    unbindFromHost,
    deleteAccessory
  } = useAccessoryDetail(id)

  // Local UI States
  const [showBindModal, setShowBindModal] = useState(false)
  const [showUnbindModal, setShowUnbindModal] = useState(false)

  // 处理物理删除
  const handleDelete = async () => {
    if (!(await confirm({ 
      title: t('equipment.action.confirm_delete'), 
      content: t('equipment.action.delete_desc'), 
      type: 'danger' 
    }))) return
    
    const success = await deleteAccessory()
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
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Component Archives...</p>
      </div>
    )
  }

  if (!accessory) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center text-center">
        <div className="premium-card p-12 max-w-sm bg-white border-none shadow-sm rounded-[40px]">
          <AlertCircle size={64} className="text-rose-500 mx-auto mb-6 opacity-20" />
          <h2 className="text-2xl font-bold text-slate-700 leading-tight mb-2">{t('equipment.empty.no_equipment')}</h2>
          <p className="text-sm font-medium text-slate-400 mb-8 px-4">The requested component could not be found in active inventory.</p>
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
      
      {/* 1. 顶部操作组件 */}
      <AccessoryHeader 
        isEditing={isEditing}
        actionLoading={actionLoading}
        onEdit={startEditing}
        onCancel={cancelEditing}
        onSave={saveChanges}
        onDelete={handleDelete}
      />

      <div className="max-w-6xl mx-auto space-y-8">
         
         {/* 2. 配件身份展示 */}
         <AccessoryProfileCard accessory={accessory} />

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* 中间列：技术参数与视觉资料 */}
            <div className="lg:col-span-2 space-y-8">
               <AccessorySpecsTable 
                 accessory={accessory}
                 isEditing={isEditing}
                 editForm={editForm}
                 onFormChange={setEditForm}
               />
               <AccessoryMediaGrid 
                 images={images}
                 uploading={uploading}
                 onUpload={uploadImages}
                 onDelete={handleImageDelete}
                 fileInputRef={fileInputRef}
               />
            </div>

            {/* 右侧边栏：位置、状态与连接�?*/}
            <AccessoryConnectivitySidebar 
              accessory={accessory}
              onBind={() => {
                loadAvailableHosts()
                setShowBindModal(true)
              }}
              onUnbind={() => setShowUnbindModal(true)}
            />
         </div>
      </div>

      {/* 4. 弹窗层：两步式连接协�?*/}
      <BindHostModal 
        isOpen={showBindModal}
        loading={loadingEquip}
        availableHosts={availableEquipment}
        actionLoading={actionLoading}
        maxQty={accessory.quantity}
        onClose={() => setShowBindModal(false)}
        onConfirm={async (hostId, qty) => {
          const success = await bindToHost(hostId, qty)
          if (success) setShowBindModal(false)
        }}
      />

      <UnbindHostModal 
        accessoryName={accessory.accessory_name}
        isOpen={showUnbindModal}
        maxQty={accessory.quantity}
        actionLoading={actionLoading}
        onClose={() => setShowUnbindModal(false)}
        onConfirm={async (qty) => {
          const success = await unbindFromHost(qty)
          if (success) setShowUnbindModal(false)
        }}
      />

    </div>
  )
}

export default AccessoryDetailPage
