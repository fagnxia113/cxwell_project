import { UnifiedFormTemplate } from '../../../services/UnifiedFormService.js';

export const equipmentFormTemplates: UnifiedFormTemplate[] = [
  {
    id: 'form-equipment-create',
    key: 'equipment-create-form',
    name: '设备创建表单',
    description: '用于创建新设备的基础表单',
    module: 'equipment',
    businessEntityType: 'Equipment',
    version: 1,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fields: [
      { name: 'name', label: '设备名称', type: 'text', required: true },
      { name: 'type', label: '设备类型', type: 'select', required: true, options: [{ label: '机械设备', value: 'machinery' }, { label: '运输工具', value: 'vehicle' }] },
      { name: 'status', label: '设备状态', type: 'select', required: true, defaultValue: 'available' }
    ]
  },
  {
    id: 'form-equipment-transfer',
    key: 'equipment-transfer-form',
    name: '设备调拨表单',
    description: '用于在仓库和项目之间调拨设备的表单',
    module: 'equipment',
    businessEntityType: 'EquipmentTransfer',
    version: 1,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fields: [
      { 
        name: 'fromLocationType', 
        label: '调出位置类型', 
        type: 'select', 
        required: true,
        options: [
          { label: '仓库', value: 'warehouse' },
          { label: '项目', value: 'project' }
        ],
        visibleOn: ['start', 'from-location-manager', 'to-location-manager', 'unreceived-review'],
        editableOn: ['start']
      },
      { 
        name: 'fromLocationId', 
        label: '调出位置', 
        type: 'select', 
        dynamicOptions: 'fromLocationType',
        required: true,
        visibleOn: ['start', 'from-location-manager', 'to-location-manager', 'unreceived-review'],
        editableOn: ['start'],
        businessConfig: { autoFill: true }
      },
      { 
        name: 'fromManagerId', 
        label: '调出位置负责人', 
        type: 'user', 
        required: false,
        visibleOn: ['start', 'from-location-manager', 'to-location-manager', 'unreceived-review'],
        editableOn: []
      },
      { 
        name: 'toLocationType', 
        label: '调入位置类型', 
        type: 'select', 
        required: true,
        options: [
          { label: '仓库', value: 'warehouse' },
          { label: '项目', value: 'project' }
        ],
        visibleOn: ['start', 'from-location-manager', 'to-location-manager', 'unreceived-review'],
        editableOn: ['start']
      },
      { 
        name: 'toLocationId', 
        label: '调入位置', 
        type: 'select', 
        dynamicOptions: 'toLocationType',
        required: true,
        visibleOn: ['start', 'from-location-manager', 'to-location-manager', 'unreceived-review'],
        editableOn: ['start'],
        businessConfig: { autoFill: true }
      },
      { 
        name: 'toManagerId', 
        label: '调入位置负责人', 
        type: 'user', 
        required: false,
        visibleOn: ['start', 'from-location-manager', 'to-location-manager', 'unreceived-review'],
        editableOn: []
      },
      { 
        name: 'transferReason', 
        label: '调拨原因', 
        type: 'textarea', 
        required: true,
        visibleOn: ['start', 'from-location-manager', 'to-location-manager', 'unreceived-review'],
        editableOn: ['start']
      },
      { 
        name: 'expectedArrivalDate', 
        label: '期望到货时间', 
        type: 'date', 
        required: true,
        visibleOn: ['start', 'from-location-manager', 'to-location-manager', 'unreceived-review'],
        editableOn: ['start']
      },
      { 
        name: 'items', 
        label: '调拨明细', 
        type: 'array', 
        required: true,
        visibleOn: ['start', 'from-location-manager', 'to-location-manager', 'unreceived-review'],
        editableOn: ['start'],
        arrayConfig: {
          modalSelector: true,
          fields: [
            { name: 'equipment_id', label: '设备', type: 'select', required: true },
            { name: 'quantity', label: '调拨数量', type: 'number', required: true },
            { name: 'shipping_images', label: '发货照片', type: 'images', required: false },
            { name: 'received_quantity', label: '实收数量', type: 'number', required: false },
            { name: 'receiving_images', label: '收货图片', type: 'images', required: false }
          ]
        }
      },
      { 
        name: 'shipped_at', 
        label: '发货时间', 
        type: 'datetime', 
        required: true,
        visibleOn: ['from-location-manager', 'to-location-manager', 'unreceived-review'],
        editableOn: ['from-location-manager']
      },
      { 
        name: 'shipping_remark', 
        label: '发货备注', 
        type: 'textarea', 
        required: false,
        visibleOn: ['from-location-manager', 'to-location-manager', 'unreceived-review'],
        editableOn: ['from-location-manager']
      },
      {
        name: 'shipping_package_images',
        label: '整体打包图片（发货）',
        type: 'images',
        multiple: true,
        visibleOn: ['from-location-manager', 'to-location-manager', 'unreceived-review'],
        editableOn: ['from-location-manager']
      },
      {
        name: 'shipping_no',
        label: '物流/发货单号',
        type: 'text',
        required: true,
        visibleOn: ['from-location-manager', 'to-location-manager', 'unreceived-review'],
        editableOn: ['from-location-manager']
      },
      { 
        name: 'received_at', 
        label: '到货时间', 
        type: 'datetime', 
        required: true,
        visibleOn: ['to-location-manager', 'unreceived-review'],
        editableOn: ['to-location-manager']
      },
      {
        name: 'receiving_package_images',
        label: '整体打包图片（收货）',
        type: 'images',
        multiple: true,
        visibleOn: ['to-location-manager', 'unreceived-review'],
        editableOn: ['to-location-manager']
      },
      { 
        name: 'receive_status', 
        label: '收货状态', 
        type: 'select', 
        required: true,
        options: [
          { label: '全部收货', value: 'normal' },
          { label: '部分收货', value: 'partial' },
          { label: '全部未到货', value: 'unreceived' }
        ],
        visibleOn: ['to-location-manager', 'unreceived-review'],
        editableOn: ['to-location-manager']
      }
    ]
  },
  {
    id: 'form-equipment-inbound',
    key: 'equipment-inbound-form',
    name: '设备入库表单',
    description: '设备采购入库或退场入库表单',
    module: 'equipment',
    businessEntityType: 'EquipmentInbound',
    version: 1,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fields: [
      { name: 'warehouse_id', label: '入库仓库', type: 'select', required: true },
      { name: 'items', label: '设备明细', type: 'array', required: true }
    ]
  },
  {
    id: 'form-equipment-scrap-sale',
    key: 'equipment-scrap-sale-form',
    name: '设备报废/出售申请',
    description: '申请设备报废或出售处理',
    module: 'equipment',
    businessEntityType: 'EquipmentScrapSale',
    version: 1,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fields: [
      { 
        name: 'location_type', 
        label: '位置类型', 
        type: 'select', 
        required: true, 
        options: [
          { label: '仓库', value: 'warehouse' }, 
          { label: '项目', value: 'project' }
        ],
        visibleOn: ['start', 'warehouse-manager'],
        editableOn: ['start']
      },
      { 
        name: 'location_id', 
        label: '当前位置', 
        type: 'select', 
        dynamicOptions: 'location_type', 
        required: true,
        visibleOn: ['start', 'warehouse-manager'],
        editableOn: ['start']
      },
      {
        name: 'type',
        label: '处理类型',
        type: 'select',
        required: true,
        options: [
          { label: '报废', value: 'scrap' },
          { label: '出售', value: 'sale' }
        ],
        visibleOn: ['start', 'warehouse-manager'],
        editableOn: ['start']
      },
      {
        name: 'items',
        label: '设备明细',
        type: 'array',
        required: true,
        arrayConfig: {
          modalSelector: true
        },
        visibleOn: ['start', 'warehouse-manager'],
        editableOn: ['start']
      },
      {
        name: 'reason',
        label: '处理原因',
        type: 'textarea',
        required: true,
        visibleOn: ['start', 'warehouse-manager'],
        editableOn: ['start']
      },
      {
        name: 'buyer',
        label: '购买方',
        type: 'text',
        visibleOn: ['start', 'warehouse-manager'],
        editableOn: ['start']
      },
      {
        name: 'sale_price',
        label: '成交价格',
        type: 'number',
        visibleOn: ['start', 'warehouse-manager'],
        editableOn: ['start']
      }
    ]
  },
  {
    id: 'form-equipment-repair',
    key: 'equipment-repair-form',
    name: '设备维修申请',
    description: '申请设备维修处理',
    module: 'equipment',
    businessEntityType: 'EquipmentRepair',
    version: 1,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fields: [
      { 
        name: 'location_type', 
        label: '位置类型', 
        type: 'select', 
        required: true, 
        options: [
          { label: '仓库', value: 'warehouse' }, 
          { label: '项目', value: 'project' }
        ],
        visibleOn: ['start', 'location-manager-ship', 'receiving'],
        editableOn: ['start']
      },
      { 
        name: 'location_id', 
        label: '当前位置', 
        type: 'select', 
        dynamicOptions: 'location_type',
        required: true,
        businessConfig: { autoFill: true },
        visibleOn: ['start', 'location-manager-ship', 'receiving'],
        editableOn: ['start']
      },
      { 
        name: 'location_manager_id', 
        label: '管理员', 
        type: 'user', 
        required: true,
        readonly: true,
        visibleOn: ['start', 'location-manager-ship', 'receiving'],
        editableOn: []
      },
      { 
        name: 'faultDescription', 
        label: '故障描述', 
        type: 'textarea', 
        required: true,
        visibleOn: ['start', 'location-manager-ship', 'receiving'],
        editableOn: ['start']
      },
      { 
        name: 'repairServiceProvider', 
        label: '维修服务商', 
        type: 'text',
        visibleOn: ['start', 'location-manager-ship', 'receiving'],
        editableOn: ['start']
      },
      { 
        name: 'items', 
        label: '维修明细', 
        type: 'array', 
        required: true,
        visibleOn: ['start', 'location-manager-ship', 'receiving'],
        editableOn: ['start'],
        arrayConfig: {
          modalSelector: true,
          fields: [
            { name: 'equipment_id', label: '设备ID', type: 'text', disabled: true },
            { name: 'name', label: '设备名称', type: 'text', disabled: true },
            { name: 'quantity', label: '数量', type: 'number', required: true }
          ]
        }
      }
    ]
  },
  {
    id: 'form-equipment-repair-shipping',
    key: 'equipment-repair-shipping-form',
    name: '设备维修发货表单',
    description: '用于记录设备维修发货信息的表单',
    module: 'equipment',
    businessEntityType: 'EquipmentRepair',
    version: 1,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fields: [
      { 
        name: 'shipped_at', 
        label: '发货时间', 
        type: 'date', 
        required: true,
        visibleOn: ['shipping', 'receiving'],
        editableOn: ['shipping'],
        defaultValue: new Date().toISOString().split('T')[0]
      },
      { 
        name: 'shipping_no', 
        label: '物流/发货单号', 
        type: 'text', 
        required: true,
        visibleOn: ['shipping', 'receiving'],
        editableOn: ['shipping']
      },
      { 
        name: 'shipping_remark', 
        label: '发货备注', 
        type: 'textarea', 
        required: false,
        visibleOn: ['shipping', 'receiving'],
        editableOn: ['shipping']
      },
      {
        name: 'shipping_package_images',
        label: '整体打包图片（发货）',
        type: 'images',
        multiple: true,
        required: true,
        visibleOn: ['shipping', 'receiving'],
        editableOn: ['shipping']
      },
      { 
        name: 'equipmentData', 
        label: '发货确认', 
        type: 'array', 
        required: true,
        visibleOn: ['shipping', 'receiving'],
        editableOn: ['shipping'],
        arrayConfig: {
          fields: [
            { name: 'equipmentId', label: '设备ID', type: 'text', disabled: true },
            { name: 'equipmentName', label: '设备名称', type: 'text', disabled: true },
            { name: 'repairQuantity', label: '数量', type: 'number', disabled: true },
            { name: 'shipping_images', label: '明细照片', type: 'images', multiple: true, required: true }
          ]
        }
      }
    ]
  },
  {
    id: 'form-equipment-repair-receiving',
    key: 'equipment-repair-receiving-form',
    name: '设备维修收货表单',
    description: '用于记录维修归还收货信息的表单',
    module: 'equipment',
    businessEntityType: 'EquipmentRepair',
    version: 1,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fields: [
      { 
        name: 'received_at', 
        label: '收货时间', 
        type: 'datetime', 
        required: true,
        visibleOn: ['receiving'],
        editableOn: ['receiving'],
        defaultValue: new Date().toISOString()
      },
      { 
        name: 'receiving_remark', 
        label: '收货备注', 
        type: 'textarea', 
        required: false,
        visibleOn: ['receiving'],
        editableOn: ['receiving']
      },
      {
        name: 'receiving_package_images',
        label: '整体打包图片（收货）',
        type: 'images',
        multiple: true,
        required: true,
        visibleOn: ['receiving'],
        editableOn: ['receiving']
      },
      { 
        name: 'equipmentData', 
        label: '收货确认', 
        type: 'array', 
        required: true,
        visibleOn: ['receiving'],
        editableOn: ['receiving'],
        arrayConfig: {
          fields: [
            { name: 'equipmentId', label: '设备ID', type: 'text', disabled: true },
            { name: 'equipmentName', label: '设备名称', type: 'text', disabled: true },
            { name: 'repairQuantity', label: '数量', type: 'number', disabled: true },
            { name: 'receiving_images', label: '确认照片', type: 'images', multiple: true, required: true }
          ]
        }
      }
    ]
  }
];
