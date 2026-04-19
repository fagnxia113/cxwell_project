import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Activity, AlertTriangle } from 'lucide-react'

// Custom Hooks
import { useTransferDetail } from '../../hooks/useTransferDetail'

// Sub-components
import TransferHeader from '../../components/equipment/transfer/TransferHeader'
import TransferPath from '../../components/equipment/transfer/TransferPath'
import TransferItemsTable from '../../components/equipment/transfer/TransferItemsTable'
import TransferActionSidebar from '../../components/equipment/transfer/TransferActionSidebar'
import ShippingDialog from '../../components/equipment/transfer/ShippingDialog'
import ReceivingDialog from '../../components/equipment/transfer/ReceivingDialog'

/**
 * 设备调拨详情页 (重构版)
 * 核心逻辑：Hook 驱动 + 模块化 UI
 * 优势：降低长列表渲染压力，隔离弹窗状态，提高代码库维护性。
 */
export default function TransferDetailPage() {
  const { t } = useTranslation()
  const { 
    order, 
    loading, 
    currentUser, 
    handleApprove, 
    handleReject, 
    handleConfirmShip, 
    handleConfirmReceive, 
    handleCancel,
    handleImageUpload
  } = useTransferDetail(undefined) // useParams id handled inside hook

  const [showShippingDialog, setShowShippingDialog] = useState(false)
  const [showReceivingDialog, setShowReceivingDialog] = useState(false)

  // 加载中骨架
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
        <Activity className="text-blue-600 animate-spin" size={48} />
        <div className="flex flex-col items-center gap-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.loading')}</p>
          <div className="h-1 w-24 bg-slate-100 rounded-full overflow-hidden">
             <div className="h-full bg-blue-500 animate-progress w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  // 无数据状态
  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-20 gap-4 bg-slate-50">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center gap-4">
           <AlertTriangle className="text-amber-200" size={64} />
           <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{t('equipment.empty.no_archive')}</p>
           <button 
             onClick={() => window.history.back()} 
             className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
           >
             {t('common.back')}
           </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8 space-y-8 animate-fade-in custom-scrollbar pb-24">
      
      {/* 1. 顶部导航与基本信息 */}
      <TransferHeader order={order} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-[1600px] mx-auto">
        
        <div className="lg:col-span-2 space-y-8">
           {/* 2. 调拨路径展示 */}
           <TransferPath order={order} />

           {/* 3. 设备及配件清单详情 */}
           <TransferItemsTable items={order.items} />
        </div>

        <div className="space-y-8">
           {/* 4. 侧边栏：物流详情、核心操作按钮、生命周期时间轴 */}
           <TransferActionSidebar 
             order={order}
             currentUser={currentUser}
             onApprove={handleApprove}
             onReject={handleReject}
             onShip={() => setShowShippingDialog(true)}
             onReceive={() => setShowReceivingDialog(true)}
             onCancel={handleCancel}
           />
        </div>
      </div>

      {/* 5. 交互式业务弹窗 */}
      {showShippingDialog && (
        <ShippingDialog 
          order={order}
          onClose={() => setShowShippingDialog(false)}
          onConfirm={async (shippingData) => {
            const res = await handleConfirmShip(shippingData)
            return !!res
          }}
          onImageUpload={handleImageUpload}
        />
      )}

      {showReceivingDialog && (
        <ReceivingDialog 
          order={order}
          onClose={() => setShowReceivingDialog(false)}
          onConfirm={async (receivingData) => {
            const res = await handleConfirmReceive(receivingData)
            return !!res
          }}
          onImageUpload={handleImageUpload}
        />
      )}

    </div>
  )
}
