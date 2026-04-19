import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '../utils/apiClient';
import { useMessage } from './useMessage';
import { useTranslation } from 'react-i18next';

// --- Types ---
export interface Accessory {
  id: string;
  accessory_name: string;
  model_no: string;
  brand?: string;
  category: 'instrument' | 'fake_load' | 'accessory' | 'general';
  unit: string;
  quantity: number;
  manage_code?: string;
  status: string;
  health_status: string;
  usage_status: string;
  location_status: string;
}

export interface EquipmentImage {
  id: string;
  image_type: string;
  image_url: string;
  image_name?: string;
  created_at: string;
}

export interface Equipment {
  id: string;
  equipment_name: string;
  model_no: string;
  brand: string | null;
  manufacturer: string | null;
  technical_params: string | null;
  category: 'instrument' | 'fake_load';
  unit: string;
  quantity: number;
  manage_code: string;
  serial_number: string | null;
  location_status: string;
  location_id: string;
  location_name?: string;
  keeper_id?: string;
  health_status: string;
  usage_status: string;
  purchase_date: string | null;
  purchase_price: number | null;
  supplier: string | null;
  calibration_expiry: string | null;
  certificate_no: string | null;
  certificate_issuer: string | null;
  notes: string | null;
  attachments: any[] | null;
  created_at: string;
  updated_at: string;
  keeper_name: string | null;
  accessories: Accessory[] | null;
}

export function useEquipmentDetail(id: string | undefined) {
  const { t } = useTranslation();
  const { success, error: showError } = useMessage();

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<EquipmentImage[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const [availableAccessories, setAvailableAccessories] = useState<Accessory[]>([]);
  const [loadingAccessories, setLoadingAccessories] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Administrative Role Check
  const isAdmin = useMemo(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return false;
    const user = JSON.parse(userStr);
    return ['admin', 'root'].includes(user.role);
  }, []);

  // 1. Data Loading
  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [eqRes, imgRes] = await Promise.all([
        apiClient.get<any>(`/api/equipment/instances/${id}`),
        apiClient.get<any>(`/api/equipment/images/equipment/${id}`)
      ]);
      if (eqRes.success) setEquipment(eqRes.data);
      if (imgRes.success) setImages(imgRes.data || []);
    } catch (err: any) {
      showError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [id, t, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 2. Image Management
  const uploadImages = async (files: FileList) => {
    if (!id || !equipment) return;
    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('image', files[i]);
    }
    formData.append('image_type', 'main');
    formData.append('equipment_id', id);
    formData.append('equipment_name', equipment.equipment_name);
    formData.append('model_no', equipment.model_no);

    try {
      const result = await apiClient.post<any>('/api/equipment/images/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (result.success) {
        setImages(prev => [...prev, ...(Array.isArray(result.data) ? result.data : [result.data])]);
        success(t('common.success'));
        return true;
      }
    } catch (err: any) {
      showError(err.message || t('common.error'));
    } finally {
      setUploading(false);
    }
    return false;
  };

  const deleteImage = async (imageId: string) => {
    try {
      const res = await apiClient.delete<any>(`/api/equipment/images/${imageId}`);
      if (res.success) {
        setImages(prev => prev.filter(img => img.id !== imageId));
        success(t('common.success'));
      }
    } catch (err: any) {
      showError(err.message);
    }
  };

  // 3. Accessory Management (Binding)
  const loadAvailableAccessories = async () => {
    if (!equipment?.location_id) return;
    try {
      setLoadingAccessories(true);
      const res = await apiClient.get<any>('/api/equipment/accessories/unbound', {
        params: { location_id: equipment.location_id, category: 'accessory' }
      });
      setAvailableAccessories(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAccessories(false);
    }
  };

  const bindAccessory = async (accessoryId: string, quantity: number) => {
    if (!id) return;
    try {
      setActionLoading(true);
      const res = await apiClient.post<any>(`/api/equipment/accessories/${accessoryId}/bind-to-host`, {
        host_equipment_id: id,
        quantity
      });
      if (res?.success) {
        success(t('equipment.action.bind_success'));
        await loadData();
        return true;
      }
    } catch (err: any) {
      showError(err.message || t('common.error'));
    } finally {
      setActionLoading(false);
    }
    return false;
  };

  const unbindAccessory = async (accessoryId: string, quantity: number) => {
    try {
      setActionLoading(true);
      const res = await apiClient.post<any>(`/api/equipment/accessories/${accessoryId}/unbind`, {
        quantity
      });
      if (res?.success) {
        success(t('equipment.action.unbind_success'));
        await loadData();
        return true;
      }
    } catch (err: any) {
      showError(err.message || t('common.error'));
    } finally {
      setActionLoading(false);
    }
    return false;
  };

  // 4. Lifecycle Actions
  const deleteEquipment = async () => {
    if (!id) return;
    try {
      await apiClient.delete(`/api/equipment/instances/${id}`);
      success(t('common.success'));
      return true;
    } catch (err: any) {
      showError(err.message);
      return false;
    }
  };

  return {
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
    deleteEquipment,
    refresh: loadData
  };
}
