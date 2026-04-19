import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../utils/apiClient'
import { useMessage } from './useMessage'
import { useConfirm } from './useConfirm'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

export interface AccessoryItem {
  id: string
  host_equipment_id: string
  accessory_id: string
  accessory_name: string
  accessory_model: string
  accessory_category: 'instrument' | 'fake_load' | 'accessory'
  accessory_quantity: number
  is_required: boolean
  accessory_notes: string | null
  serial_number: string | null
  accessory_manage_code: string | null
  accessory_health_status: string
  accessory_usage_status: string
}

export interface TransferItem {
  id: string
  equipment_id: string | null
  equipment_name: string
  model_no: string
  brand: string
  category: 'instrument' | 'fake_load' | 'accessory'
  unit: string
  manage_code: string | null
  serial_number: string | null
  quantity: number
  status: string
  notes: string | null
  shipping_images?: string[]
  receiving_images?: string[]
  received_quantity?: number
  accessories?: AccessoryItem[]
}

export interface TransferOrder {
  id: string
  order_no: string
  transfer_scene: 'A' | 'B' | 'C'
  transfer_type: 'single' | 'batch'
  applicant: string
  apply_date: string
  from_location_type: 'warehouse' | 'project'
  from_warehouse_id: string | null
  from_warehouse_name: string | null
  from_project_id: string | null
  from_project_name: string | null
  from_manager: string | null
  from_manager_id: string | null
  to_location_type: 'warehouse' | 'project'
  to_warehouse_id: string | null
  to_warehouse_name: string | null
  to_project_id: string | null
  to_project_name: string | null
  to_manager: string | null
  to_manager_id: string | null
  total_items: number
  total_quantity: number
  transfer_reason: string
  estimated_ship_date: string | null
  estimated_arrival_date: string | null
  transport_method: string | null
  tracking_no: string | null
  notes: string | null
  status: string
  from_approved_at: string | null
  from_approved_by: string | null
  to_approved_at: string | null
  to_approved_by: string | null
  shipped_at: string | null
  shipped_by: string | null
  received_at: string | null
  received_by: string | null
  receive_comment: string | null
  shipping_no: string | null
  shipping_attachment: string | null
  shipping_package_images?: string[]
  receiving_package_images?: string[]
  receive_status?: string | null
  created_at: string
  updated_at: string
  items: TransferItem[]
}

export function useTransferDetail(id: string | undefined) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { success, error: showError } = useMessage()
  const { confirm } = useConfirm()

  const [order, setOrder] = useState<TransferOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [uploadingImages, setUploadingImages] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      setCurrentUser(JSON.parse(userStr))
    }
  }, [])

  const loadOrder = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const result = await apiClient.get<any>(`/api/equipment/transfers/${id}`)
      const data = result?.data || (result?.id ? result : null)
      if (data) {
        setOrder(data)
      } else {
        showError(t('equipment.empty.no_archive'))
        navigate('/approvals/mine')
      }
    } catch (error: any) {
      showError(error.message || t('personnel.error.load_failed'))
    } finally {
      setLoading(false)
    }
  }, [id, t, showError, navigate])

  useEffect(() => {
    loadOrder()
  }, [loadOrder])

  const handleApprove = async () => {
    if (!order || !currentUser) return
    
    let approveType: 'from' | 'to' | undefined
    if (currentUser.employee_id === order.from_manager_id) {
      approveType = 'from'
    } else if (currentUser.employee_id === order.to_manager_id) {
      approveType = 'to'
    }
    
    const remark = window.prompt(t('workflow.action.approve') + ': ')
    if (remark === null) return
    
    setActionLoading(true)
    try {
      const result = await apiClient.put<any>(`/api/equipment/transfers/${order.id}/approve`, {
        approved: true,
        remark,
        approve_type: approveType
      })
      if (result && result.success) {
        success(t('common.success'))
        await loadOrder()
      }
    } catch (error: any) {
      showError(error.message || t('common.error'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!order) return
    const remark = window.prompt(t('workflow.action.reject') + ': ')
    if (!remark) return
    
    setActionLoading(true)
    try {
      const result = await apiClient.put<any>(`/api/equipment/transfers/${order.id}/approve`, {
        approved: false,
        remark
      })
      if (result && result.success) {
        success(t('common.success'))
        await loadOrder()
      }
    } catch (error: any) {
      showError(error.message || t('common.error'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirmShip = async (shippingData: any) => {
    if (!order) return
    setActionLoading(true)
    try {
      const result = await apiClient.put<any>(`/api/equipment/transfers/${order.id}/ship`, {
        shipped_at: shippingData.shipped_at || new Date().toISOString(),
        shipping_no: shippingData.shipping_no || '',
        shipping_attachment: shippingData.shipping_attachment || '',
        package_images: shippingData.package_images || [],
        item_images: shippingData.item_images || []
      })
      if (result && (result.success || result.id)) {
        success(t('common.success'))
        await loadOrder()
        return true
      }
    } catch (error: any) {
      showError(error.message || t('common.error'))
    } finally {
      setActionLoading(false)
    }
    return false
  }

  const handleConfirmReceive = async (receivingData: any) => {
    if (!order) return
    setActionLoading(true)
    try {
      const result = await apiClient.put<any>(`/api/equipment/transfers/${order.id}/receive`, {
        receive_status: receivingData.receive_status || 'normal',
        receive_comment: receivingData.receive_comment || '',
        package_images: receivingData.package_images || [],
        item_images: receivingData.item_images || [],
        received_items: receivingData.received_items.map((ri: any) => {
          const itemImgs = receivingData.item_images.find((ii: any) => ii.item_id === ri.item_id);
          return { ...ri, receiving_images: itemImgs ? itemImgs.images : [] };
        })
      })
      if (result && (result.success || result.id)) {
        success(t('common.success'))
        await loadOrder()
        return true
      }
    } catch (error: any) {
      showError(error.message || t('common.error'))
    } finally {
      setActionLoading(false)
    }
    return false
  }

  const handleCancel = async () => {
    if (!order) return
    if (!(await confirm({ 
      title: t('equipment.action.cancel_transfer'), 
      content: t('common.confirm'), 
      type: 'danger' 
    }))) return
    
    const reason = window.prompt(t('equipment.fields.reason') + ': ')
    if (!reason) return
    
    setActionLoading(true)
    try {
      const result = await apiClient.put<any>(`/api/equipment/transfers/${order.id}/cancel`, { reason })
      if (result && result.success) {
        success(t('common.success'))
        await loadOrder()
      }
    } catch (error: any) {
      showError(error.message || t('common.error'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleImageUpload = async (file: File): Promise<string | null> => {
    setUploadingImages(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('image_type', 'transfer')
      formData.append('business_type', 'transfer')
      const result = await apiClient.post<any>('/api/equipment/images/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return result?.data?.image_url || result?.image_url || null
    } catch (error: any) {
      showError(error.message || t('common.error'))
      return null
    } finally {
      setUploadingImages(false)
    }
  }

  return {
    order,
    loading,
    actionLoading,
    currentUser,
    uploadingImages,
    handleApprove,
    handleReject,
    handleConfirmShip,
    handleConfirmReceive,
    handleCancel,
    handleImageUpload,
    loadOrder
  }
}
