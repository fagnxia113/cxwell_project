import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '../utils/apiClient';
import { useMessage } from './useMessage';
import { useTranslation } from 'react-i18next';

// --- Types ---
export interface AccessoryImage {
  id: string;
  image_type: string;
  image_url: string;
  image_name?: string;
  created_at: string;
}

export interface Accessory {
  id: string;
  accessory_name: string;
  model_no?: string;
  brand?: string;
  category: 'instrument' | 'fake_load' | 'accessory' | 'general';
  unit: string;
  quantity: number;
  serial_number?: string;
  manage_code?: string;
  status: 'normal' | 'lost' | 'damaged';
  health_status: 'normal' | 'affected' | 'broken';
  usage_status: 'idle' | 'in_use';
  location_status: string;
  location_id?: string;
  location_name?: string;
  location_manager_id?: string;
  keeper_id?: string;
  keeper_name?: string;
  host_equipment_id?: string;
  host_equipment_name?: string;
  bound_at?: string;
  purchase_date?: string;
  purchase_price?: number;
  notes?: string;
  attachments?: any[];
  created_at: string;
  updated_at?: string;
}

export function useAccessoryDetail(id: string | undefined) {
  const { t } = useTranslation();
  const { success, error: showError } = useMessage();

  const [accessory, setAccessory] = useState<Accessory | null>(null);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<AccessoryImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Inline Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Accessory>>({});

  // Binding State
  const [availableEquipment, setAvailableEquipment] = useState<any[]>([]);
  const [loadingEquip, setLoadingEquip] = useState(false);

  // 1. Data Loader
  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [accRes, imgRes] = await Promise.all([
        apiClient.get<any>(`/api/equipment/accessories/${id}`),
        apiClient.get<any>(`/api/equipment/images/accessory/${id}`)
      ]);
      if (accRes?.success) {
        setAccessory(accRes.data);
        setEditForm(accRes.data);
      }
      if (imgRes?.success) {
        setImages(imgRes.data || []);
      }
    } catch (err: any) {
      showError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [id, t, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 2. Metadata Updates (Inline Edit)
  const startEditing = () => {
    if (accessory) {
      setEditForm(accessory);
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setEditForm(accessory || {});
    setIsEditing(false);
  };

  const saveChanges = async () => {
    if (!accessory) return;
    try {
      setActionLoading(true);
      await apiClient.put(`/api/equipment/accessories/${accessory.id}`, editForm);
      success(t('common.success'));
      setIsEditing(false);
      await loadData();
      return true;
    } catch (err: any) {
      showError(err.message || t('common.error'));
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Image Actions
  const uploadImages = async (files: FileList) => {
    if (!id) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('image', files[i]);
        formData.append('image_type', 'accessory');
        formData.append('equipment_id', id);
        
        const result = await apiClient.post<any>('/api/equipment/images/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (result.success && result.data) {
          setImages(prev => [...prev, result.data]);
        }
      }
      success(t('common.success'));
    } catch (err: any) {
      showError(err.message || t('common.error'));
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (imageId: string) => {
    try {
      const res = await apiClient.delete<any>(`/api/equipment/images/${imageId}`);
      if (res.success) {
        setImages(prev => prev.filter(img => img.id !== imageId));
        success(t('common.success'));
        return true;
      }
    } catch (err: any) {
      showError(err.message);
    }
    return false;
  };

  // 4. Connectivity (Binding to Host)
  const loadAvailableHosts = async () => {
    if (!accessory?.location_id) return;
    try {
      setLoadingEquip(true);
      const data = await apiClient.get<any>('/api/equipment/instances', {
        params: {
          location_id: accessory.location_id, 
          category: 'instrument', 
          pageSize: 50
        }
      });
      setAvailableEquipment(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEquip(false);
    }
  };

  const bindToHost = async (hostId: string, quantity: number) => {
    if (!id) return;
    try {
      setActionLoading(true);
      const res = await apiClient.post<any>(`/api/equipment/accessories/${id}/bind-to-host`, {
        host_equipment_id: hostId,
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

  const unbindFromHost = async (quantity: number) => {
    if (!id) return;
    try {
      setActionLoading(true);
      const res = await apiClient.post<any>(`/api/equipment/accessories/${id}/unbind`, { 
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

  // 5. Lifecycle Actions
  const deleteAccessory = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      await apiClient.delete(`/api/equipment/accessories/${id}`);
      success(t('common.success'));
      return true;
    } catch (err: any) {
      showError(err.message || t('common.error'));
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  return {
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
    deleteAccessory,
    refresh: loadData
  };
}
