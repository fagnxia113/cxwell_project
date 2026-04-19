import { EquipmentCategory, TrackingType, LocationStatus } from './Equipment.entity.js';

export interface BasicInfoDTO {
  equipmentName: string;
  modelNo: string;
  category: EquipmentCategory;
  trackingType: TrackingType;
  quantity: number;
  unit?: string;
}

export interface TrackingInfoDTO {
  serialNumber?: string;
  manageCode?: string;
}

export interface LocationInfoDTO {
  locationId: string;
  keeperId?: string;
  locationStatus?: LocationStatus;
}

export interface FinancialInfoDTO {
  supplier?: string;
  purchaseDate?: string | Date;
  purchasePrice?: number | string;
}

export interface CalibrationInfoDTO {
  calibrationExpiry?: string | Date;
  certificateNo?: string;
  certificateIssuer?: string;
}

export interface TechnicalInfoDTO {
  manufacturer?: string;
  brand?: string;
  technicalParams?: string;
}

export interface AttachmentInfoDTO {
  notes?: string;
  attachments?: string[];
  images?: string[];
}

export class EquipmentInboundDTO {
  basicInfo: BasicInfoDTO;
  trackingInfo: TrackingInfoDTO;
  locationInfo: LocationInfoDTO;
  financialInfo?: FinancialInfoDTO;
  calibrationInfo?: CalibrationInfoDTO;
  technicalInfo?: TechnicalInfoDTO;
  attachmentInfo?: AttachmentInfoDTO;

  constructor(data: Partial<EquipmentInboundDTO> & {
    basicInfo: BasicInfoDTO;
    trackingInfo: TrackingInfoDTO;
    locationInfo: LocationInfoDTO;
  }) {
    this.basicInfo = {
      unit: '台',
      ...data.basicInfo
    };
    this.trackingInfo = data.trackingInfo;
    this.locationInfo = data.locationInfo;
    this.financialInfo = data.financialInfo;
    this.calibrationInfo = data.calibrationInfo;
    this.technicalInfo = data.technicalInfo;
    this.attachmentInfo = data.attachmentInfo;
  }

  toPlainObject(): Record<string, any> {
    return {
      equipment_name: this.basicInfo.equipmentName,
      model_no: this.basicInfo.modelNo,
      category: this.basicInfo.category,
      tracking_type: this.basicInfo.trackingType,
      quantity: this.basicInfo.quantity,
      unit: this.basicInfo.unit,
      serial_number: this.trackingInfo.serialNumber,
      manage_code: this.trackingInfo.manageCode,
      location_id: this.locationInfo.locationId,
      keeper_id: this.locationInfo.keeperId,
      location_status: this.locationInfo.locationStatus,
      manufacturer: this.technicalInfo?.manufacturer,
      brand: this.technicalInfo?.brand,
      supplier: this.financialInfo?.supplier,
      purchase_date: this.financialInfo?.purchaseDate,
      purchase_price: this.financialInfo?.purchasePrice,
      calibration_expiry: this.calibrationInfo?.calibrationExpiry,
      certificate_no: this.calibrationInfo?.certificateNo,
      certificate_issuer: this.calibrationInfo?.certificateIssuer,
      technical_params: this.technicalInfo?.technicalParams,
      notes: this.attachmentInfo?.notes,
      attachments: this.attachmentInfo?.attachments,
      images: this.attachmentInfo?.images
    };
  }
}

export interface AccessoryInboundDTO {
  accessoryName: string;
  modelNo?: string;
  category: EquipmentCategory;
  trackingType: TrackingType;
  quantity: number;
  serialNumber?: string;
  manageCode?: string;
  unit?: string;
  locationId: string;
  locationStatus?: LocationStatus;
  keeperId?: string;
  purchaseDate?: string | Date;
  purchasePrice?: number;
  supplier?: string;
  hostEquipmentId?: string;
  usageStatus?: 'idle' | 'in_use';
  sourceType: 'inbound_bundle' | 'inbound_separate';
  notes?: string;
  attachments?: string[];
  images?: string[];
}

export class WorkflowFormDataMapper {
  static toEquipmentInboundDTO(
    formData: Record<string, any>,
    item: Record<string, any>,
    locationId: string,
    defaultKeeperId?: string,
    locationStatus: LocationStatus = 'warehouse'
  ): EquipmentInboundDTO {
    const isInstrument = item.category === 'instrument';
    const isIndependentCode = isInstrument || item.is_independent_code === true || item.is_independent_code === 'true';

    return new EquipmentInboundDTO({
      basicInfo: {
        equipmentName: item.equipment_name,
        modelNo: item.model_no || item.model || '',
        category: item.category,
        trackingType: isIndependentCode ? 'SERIALIZED' : 'BATCH',
        quantity: item.quantity || 1,
        unit: item.unit
      },
      trackingInfo: {
        serialNumber: item.serial_number || item.serial_numbers,
        manageCode: item.manage_code || item.item_code || item.equipment_no
      },
      locationInfo: {
        locationId: item.location_id || locationId,
        keeperId: item.keeper_id || defaultKeeperId,
        locationStatus
      },
      technicalInfo: {
        manufacturer: item.manufacturer,
        brand: item.brand,
        technicalParams: item.technical_params
      },
      financialInfo: {
        supplier: item.supplier || formData.supplier,
        purchaseDate: item.purchase_date || formData.purchase_date,
        purchasePrice: item.purchase_price
      },
      calibrationInfo: {
        calibrationExpiry: item.calibration_expiry || item.certificate_expiry_date,
        certificateNo: item.certificate_no,
        certificateIssuer: item.certificate_issuer
      },
      attachmentInfo: {
        notes: item.item_notes || item.notes || formData.notes || '',
        attachments: item.attachments || formData.attachments || [],
        images: this.extractImages(item, formData)
      }
    });
  }

  static toAccessoryInboundDTO(
    formData: Record<string, any>,
    item: Record<string, any>,
    locationId: string,
    defaultKeeperId?: string,
    locationStatus: LocationStatus = 'warehouse',
    hostEquipmentId?: string,
    sourceType: 'inbound_bundle' | 'inbound_separate' = 'inbound_separate'
  ): AccessoryInboundDTO {
    const isIndependentCode = item.is_independent_code === true || item.is_independent_code === 'true';

    return {
      accessoryName: item.accessory_name || item.equipment_name || item.name || '',
      modelNo: item.accessory_model || item.model_no || item.model || '',
      category: (item.category || 'instrument') as EquipmentCategory,
      trackingType: isIndependentCode ? 'SERIALIZED' : 'BATCH',
      quantity: item.accessory_quantity || item.quantity || 1,
      serialNumber: item.accessory_serial_number || item.serial_numbers || item.serial_number,
      manageCode: item.accessory_manage_code || item.manage_code || item.item_code,
      unit: item.unit || item.accessory_unit,
      locationId: item.location_id || locationId,
      locationStatus,
      keeperId: item.keeper_id || defaultKeeperId,
      purchaseDate: item.purchase_date || formData.purchase_date,
      purchasePrice: item.purchase_price,
      supplier: item.supplier || formData.supplier,
      hostEquipmentId,
      usageStatus: hostEquipmentId ? 'in_use' : 'idle',
      sourceType,
      notes: item.accessory_notes || item.notes || '',
      attachments: item.accessory_attachments || item.attachments || [],
      images: this.extractImages(item, formData)
    };
  }

  private static extractImages(item: Record<string, any>, formData: Record<string, any>): string[] {
    const imageFields = [
      item.images,
      item.field_images,
      item.equipment_images,
      item.main_images,
      item.accessory_images,
      formData.images,
      formData.equipment_images
    ];

    const images: string[] = [];
    for (const field of imageFields) {
      if (Array.isArray(field)) {
        for (const img of field) {
          if (typeof img === 'string') {
            images.push(img);
          } else if (img && typeof img === 'object') {
            const url = img.url || img.response?.url;
            if (url) images.push(url);
          }
        }
      }
    }
    return images;
  }
}
