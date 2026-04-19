import * as XLSX from 'xlsx';

export class ExcelExportService {
  exportProjects(projects: any[]): Buffer {
    const data = projects.map(p => ({
      '项目名称': p.name,
      '项目编号': p.code,
      '项目类型': this.formatProjectType(p.type),
      '国家': p.country,
      '开始日期': p.start_date ? new Date(p.start_date).toLocaleDateString() : '',
      '结束日期': p.end_date ? new Date(p.end_date).toLocaleDateString() : '',
      '描述': p.description || '',
      '项目状态': this.formatProjectStatus(p.status),
      '项目经理': p.manager || '',
      '客户名称': p.customer_name || '',
      '预算': p.budget || '',
      '地址': p.address || '',
      '面积': p.area || '',
      '容量': p.capacity || '',
      '机柜数量': p.rack_count || '',
      '机柜功率': p.rack_power || '',
      '强电架构': p.power_arch || '',
      '暖通架构': p.hvac_arch || '',
      '消防架构': p.fire_arch || '',
      '弱电架构': p.weak_arch || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '项目列表');
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  exportEquipment(equipment: any[]): Buffer {
    const data = equipment.map(e => ({
      '设备名称': e.equipment_name || e.name,
      '规格型号': e.model_no || '',
      '设备类型': this.formatEquipmentCategory(e.category),
      '品牌': e.brand || '',
      '制造商': e.manufacturer || '',
      '数量': e.quantity || 1,
      '单位': e.unit || '台',
      '序列号': e.serial_number || '',
      '管理编码': e.manage_code || e.equipment_no || '',
      '采购日期': e.purchase_date ? new Date(e.purchase_date).toLocaleDateString() : '',
      '采购价格': e.purchase_price || '',
      '供应商': e.supplier || '',
      '校准到期日': e.calibration_expiry ? new Date(e.calibration_expiry).toLocaleDateString() : '',
      '证书编号': e.certificate_no || '',
      '发证机构': e.certificate_issuer || '',
      '技术参数': e.technical_params || '',
      '健康状态': this.formatHealthStatus(e.health_status),
      '使用状态': this.formatUsageStatus(e.usage_status),
      '所在位置': e.location_name || e.warehouse_name || '',
      '备注': e.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '设备列表');
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  exportAccessories(accessories: any[]): Buffer {
    const data = accessories.map(a => ({
      '配件名称': a.accessory_name,
      '规格型号': a.model_no || '',
      '配件类型': this.formatAccessoryCategory(a.category),
      '品牌': a.brand || '',
      '数量': a.quantity || 1,
      '单位': a.unit || '个',
      '序列号': a.serial_number || '',
      '管理编码': a.manage_code || '',
      '采购日期': a.purchase_date ? new Date(a.purchase_date).toLocaleDateString() : '',
      '采购价格': a.purchase_price || '',
      '供应商': a.supplier || '',
      '健康状态': this.formatHealthStatus(a.health_status),
      '使用状态': this.formatUsageStatus(a.usage_status),
      '来源类型': this.formatSourceType(a.source_type),
      '绑定设备': a.host_equipment_name || '',
      '保管人': a.keeper_name || '',
      '备注': a.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '配件列表');
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  private formatProjectType(type: string): string {
    const map: Record<string, string> = {
      'domestic': '国内项目',
      'foreign': '海外项目',
      'rd': '研发中心',
      'service': '服务中心'
    };
    return map[type] || type || '国内项目';
  }

  private formatProjectStatus(status: string): string {
    const map: Record<string, string> = {
      'proposal': '拟定中',
      'in_progress': '进行中',
      'completed': '已完成',
      'paused': '已暂停',
      'delayed': '已延期'
    };
    return map[status] || status || '拟定中';
  }

  private formatEquipmentCategory(category: string): string {
    const map: Record<string, string> = {
      'instrument': '仪表',
      'fake_load': '假负载',
      'cable': '电缆',
      'accessory': '配件'
    };
    return map[category] || category || '仪表';
  }

  private formatAccessoryCategory(category: string): string {
    const map: Record<string, string> = {
      'power': '电源',
      'network': '网络',
      'storage': '存储',
      'monitor': '监控',
      'cable': '线缆',
      'tool': '工具',
      'other': '其他'
    };
    return map[category] || category || '其他';
  }

  private formatHealthStatus(status: string): string {
    const map: Record<string, string> = {
      'normal': '正常',
      'affected': '受损',
      'broken': '故障'
    };
    return map[status] || status || '正常';
  }

  private formatUsageStatus(status: string): string {
    const map: Record<string, string> = {
      'idle': '闲置',
      'in_use': '使用中',
      'scrapped': '已报废',
      'sold': '已出售'
    };
    return map[status] || status || '闲置';
  }

  private formatSourceType(type: string): string {
    const map: Record<string, string> = {
      'inbound_separate': '单独入库',
      'inbound_with_equipment': '随设备入库',
      'project_transfer': '项目调拨'
    };
    return map[type] || type || '单独入库';
  }
}

export const excelExportService = new ExcelExportService();
