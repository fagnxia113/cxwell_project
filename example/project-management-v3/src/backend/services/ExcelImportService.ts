import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

export interface ImportResult {
  success: boolean;
  total: number;
  succeeded: number;
  failed: number;
  errors: Array<{ row: number; message: string }>;
  data?: any[];
}

export interface ProjectImportRow {
  项目名称: string;
  项目编号?: string;
  项目类型?: string;
  国家?: string;
  开始日期?: string;
  结束日期?: string;
  描述?: string;
  项目状态?: string;
  项目经理?: string;
  客户名称?: string;
  预算?: number;
  地址?: string;
  面积?: number;
  容量?: number;
  机柜数量?: number;
  机柜功率?: number;
  强电架构?: string;
  暖通架构?: string;
  消防架构?: string;
  弱电架构?: string;
  创建日期?: string;
  更新日期?: string;
}

export interface EquipmentImportRow {
  设备名称: string;
  规格型号?: string;
  设备类型?: string;
  品牌?: string;
  制造商?: string;
  数量?: number | string;
  单位?: string;
  序列号?: string;
  管理编码?: string;
  采购日期?: string;
  采购价格?: number;
  供应商?: string;
  校准到期日?: string;
  证书编号?: string;
  发证机构?: string;
  技术参数?: string;
  健康状态?: string;
  使用状态?: string;
  仓库?: string;
  备注?: string;
}

export interface AccessoryImportRow {
  配件名称: string;
  规格型号?: string;
  配件类型?: string;
  品牌?: string;
  数量?: number | string;
  单位?: string;
  序列号?: string;
  管理编码?: string;
  采购日期?: string;
  采购价格?: number;
  供应商?: string;
  健康状态?: string;
  使用状态?: string;
  来源类型?: string;
  备注?: string;
}

function parseExcelDate(value: any): string | null {
  if (!value) return null;
  
  if (typeof value === 'number') {
    const date = new Date((value - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }
  
  if (typeof value === 'string') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  
  return null;
}

function parseNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  return isNaN(num) ? null : num;
}

function normalizeProjectType(type?: string): string {
  if (!type) return 'domestic';
  const t = String(type).toLowerCase();
  if (t.includes('海外') || t.includes('foreign')) return 'foreign';
  if (t.includes('研发') || t.includes('rd')) return 'rd';
  if (t.includes('服务') || t.includes('service')) return 'service';
  return 'domestic';
}

function normalizeProjectStatus(status?: string): string {
  if (!status) return 'proposal';
  const s = String(status).toLowerCase();
  if (s.includes('启动') || s.includes('initiated') || s.includes('进行') || s.includes('progress')) return 'in_progress';
  if (s.includes('完成') || s.includes('completed')) return 'completed';
  if (s.includes('暂停') || s.includes('paused')) return 'paused';
  if (s.includes('延期') || s.includes('delayed')) return 'delayed';
  return 'proposal';
}

function normalizeEquipmentCategory(category?: string): string {
  if (!category) return 'instrument';
  const c = String(category).toLowerCase();
  if (c.includes('仪表') || c.includes('instrument')) return 'instrument';
  if (c.includes('假负载') || c.includes('fake_load') || c.includes('负载')) return 'fake_load';
  if (c.includes('电缆') || c.includes('cable')) return 'cable';
  if (c.includes('配件') || c.includes('accessory')) return 'accessory';
  return 'instrument';
}

function normalizeHealthStatus(status?: string): string {
  if (!status) return 'normal';
  const s = String(status).toLowerCase();
  if (s.includes('正常') || s.includes('normal')) return 'normal';
  if (s.includes('受损') || s.includes('affected')) return 'affected';
  if (s.includes('故障') || s.includes('broken')) return 'broken';
  return 'normal';
}

function normalizeUsageStatus(status?: string): string {
  if (!status) return 'idle';
  const s = String(status).toLowerCase();
  if (s.includes('闲置') || s.includes('idle')) return 'idle';
  if (s.includes('使用') || s.includes('in_use')) return 'in_use';
  if (s.includes('报废') || s.includes('scrapped')) return 'scrapped';
  if (s.includes('出售') || s.includes('sold')) return 'sold';
  return 'idle';
}

function normalizeAccessoryCategory(category?: string): string {
  if (!category) return 'other';
  const c = String(category).toLowerCase();
  if (c.includes('电源') || c.includes('power')) return 'power';
  if (c.includes('网络') || c.includes('network')) return 'network';
  if (c.includes('存储') || c.includes('storage')) return 'storage';
  if (c.includes('监控') || c.includes('monitor')) return 'monitor';
  if (c.includes('线缆') || c.includes('cable')) return 'cable';
  if (c.includes('工具') || c.includes('tool')) return 'tool';
  return 'other';
}

function normalizeSourceType(type?: string): string {
  if (!type) return 'inbound_separate';
  const t = String(type).toLowerCase();
  if (t.includes('单独入库') || t.includes('separate')) return 'inbound_separate';
  if (t.includes('随设备') || t.includes('equipment')) return 'inbound_with_equipment';
  if (t.includes('项目') || t.includes('project')) return 'project_transfer';
  return 'inbound_separate';
}

export class ExcelImportService {
  parseExcelFile(buffer: Buffer): any[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(worksheet);
  }

  importProjects(rows: ProjectImportRow[]): ImportResult {
    const result: ImportResult = {
      success: true,
      total: rows.length,
      succeeded: 0,
      failed: 0,
      errors: [],
      data: []
    };

    rows.forEach((row, index) => {
      const rowNum = index + 2;

      if (!row['项目名称']) {
        result.errors.push({ row: rowNum, message: '项目名称不能为空' });
        result.failed++;
        return;
      }

      const project = {
        id: uuidv4(),
        name: String(row['项目名称']).trim(),
        code: row['项目编号'] ? String(row['项目编号']).trim() : `PRJ-${Date.now()}-${index + 1}`,
        type: normalizeProjectType(row['项目类型']),
        country: row['国家'] ? String(row['国家']).trim() : '中国',
        start_date: parseExcelDate(row['开始日期']) || new Date().toISOString().split('T')[0],
        end_date: parseExcelDate(row['结束日期']),
        description: row['描述'] ? String(row['描述']).trim() : null,
        status: normalizeProjectStatus(row['项目状态']),
        manager: row['项目经理'] ? String(row['项目经理']).trim() : null,
        customer_name: row['客户名称'] ? String(row['客户名称']).trim() : null,
        budget: parseNumber(row['预算']),
        address: row['地址'] ? String(row['地址']).trim() : null,
        area: parseNumber(row['面积']),
        capacity: parseNumber(row['容量']),
        rack_count: parseNumber(row['机柜数量']) ? Math.round(parseNumber(row['机柜数量'])!) : null,
        rack_power: parseNumber(row['机柜功率']),
        power_arch: row['强电架构'] ? String(row['强电架构']).trim() : null,
        hvac_arch: row['暖通架构'] ? String(row['暖通架构']).trim() : null,
        fire_arch: row['消防架构'] ? String(row['消防架构']).trim() : null,
        weak_arch: row['弱电架构'] ? String(row['弱电架构']).trim() : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      result.data!.push(project);
      result.succeeded++;
    });

    result.success = result.failed === 0;
    return result;
  }

  importEquipment(rows: EquipmentImportRow[]): ImportResult {
    const result: ImportResult = {
      success: true,
      total: rows.length,
      succeeded: 0,
      failed: 0,
      errors: [],
      data: []
    };

    rows.forEach((row, index) => {
      const rowNum = index + 2;

      if (!row['设备名称']) {
        result.errors.push({ row: rowNum, message: '设备名称不能为空' });
        result.failed++;
        return;
      }

      const quantity = parseNumber(row['数量']) || 1;
      const purchasePrice = parseNumber(row['采购价格']);

      const equipment = {
        id: uuidv4(),
        equipment_name: String(row['设备名称']).trim(),
        model_no: row['规格型号'] ? String(row['规格型号']).trim() : '',
        category: normalizeEquipmentCategory(row['设备类型']),
        brand: row['品牌'] ? String(row['品牌']).trim() : null,
        manufacturer: row['制造商'] ? String(row['制造商']).trim() : null,
        quantity: quantity,
        unit: row['单位'] ? String(row['单位']).trim() : '台',
        serial_number: row['序列号'] ? String(row['序列号']).trim() : null,
        manage_code: row['管理编码'] ? String(row['管理编码']).trim() : `EQ-${Date.now()}-${index + 1}`,
        purchase_date: parseExcelDate(row['采购日期']),
        purchase_price: purchasePrice,
        supplier: row['供应商'] ? String(row['供应商']).trim() : null,
        calibration_expiry: parseExcelDate(row['校准到期日']),
        certificate_no: row['证书编号'] ? String(row['证书编号']).trim() : null,
        certificate_issuer: row['发证机构'] ? String(row['发证机构']).trim() : null,
        technical_params: row['技术参数'] ? String(row['技术参数']).trim() : null,
        health_status: normalizeHealthStatus(row['健康状态']),
        usage_status: normalizeUsageStatus(row['使用状态']),
        location_status: 'warehouse',
        warehouse_name: row['仓库'] ? String(row['仓库']).trim() : null,
        notes: row['备注'] ? String(row['备注']).trim() : null,
        tracking_type: 'SERIALIZED',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      result.data!.push(equipment);
      result.succeeded++;
    });

    result.success = result.failed === 0;
    return result;
  }

  importAccessories(rows: AccessoryImportRow[]): ImportResult {
    const result: ImportResult = {
      success: true,
      total: rows.length,
      succeeded: 0,
      failed: 0,
      errors: [],
      data: []
    };

    rows.forEach((row, index) => {
      const rowNum = index + 2;

      if (!row['配件名称']) {
        result.errors.push({ row: rowNum, message: '配件名称不能为空' });
        result.failed++;
        return;
      }

      const quantity = parseNumber(row['数量']) || 1;
      const purchasePrice = parseNumber(row['采购价格']);

      const accessory = {
        id: uuidv4(),
        accessory_name: String(row['配件名称']).trim(),
        model_no: row['规格型号'] ? String(row['规格型号']).trim() : null,
        category: normalizeAccessoryCategory(row['配件类型']),
        brand: row['品牌'] ? String(row['品牌']).trim() : null,
        quantity: quantity,
        unit: row['单位'] ? String(row['单位']).trim() : '个',
        serial_number: row['序列号'] ? String(row['序列号']).trim() : null,
        manage_code: row['管理编码'] ? String(row['管理编码']).trim() : `ACC-${Date.now()}-${index + 1}`,
        purchase_date: parseExcelDate(row['采购日期']),
        purchase_price: purchasePrice,
        supplier: row['供应商'] ? String(row['供应商']).trim() : null,
        health_status: normalizeHealthStatus(row['健康状态']),
        usage_status: normalizeUsageStatus(row['使用状态']),
        location_status: 'warehouse',
        source_type: normalizeSourceType(row['来源类型']),
        notes: row['备注'] ? String(row['备注']).trim() : null,
        tracking_type: 'BATCH',
        status: 'normal',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      result.data!.push(accessory);
      result.succeeded++;
    });

    result.success = result.failed === 0;
    return result;
  }

  generateProjectTemplate(): Buffer {
    const template = [
      {
        '项目名称': '示例项目A',
        '项目编号': 'PRJ-2024-001',
        '项目类型': '国内项目',
        '国家': '中国',
        '开始日期': '2024-01-01',
        '结束日期': '2024-12-31',
        '描述': '项目描述信息',
        '项目状态': '进行中',
        '项目经理': '张三',
        '客户名称': '示例客户',
        '预算': 1000000,
        '地址': '北京市朝阳区',
        '面积': 1000,
        '容量': 500,
        '机柜数量': 50,
        '机柜功率': 5.5,
        '强电架构': '双路市电+UPS',
        '暖通架构': '精密空调',
        '消防架构': '气体灭火',
        '弱电架构': '综合布线'
      },
      {
        '项目名称': '示例项目B',
        '项目编号': 'PRJ-2024-002',
        '项目类型': '海外项目',
        '国家': '沙特阿拉伯',
        '开始日期': '2024-03-01',
        '结束日期': '',
        '描述': '海外工程项目',
        '项目状态': '拟定中',
        '项目经理': '李四',
        '客户名称': '海外客户',
        '预算': 5000000,
        '地址': '沙特利雅得',
        '面积': 2000,
        '容量': 1000,
        '机柜数量': 100,
        '机柜功率': 6.0,
        '强电架构': '',
        '暖通架构': '',
        '消防架构': '',
        '弱电架构': ''
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '项目导入模板');
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  generateEquipmentTemplate(): Buffer {
    const template = [
      {
        '设备名称': '挖掘机',
        '规格型号': 'XG-200',
        '设备类型': '仪表',
        '品牌': '三一',
        '制造商': '三一重工',
        '数量': 2,
        '单位': '台',
        '序列号': 'SN001',
        '管理编码': 'EQ-001',
        '采购日期': '2024-01-15',
        '采购价格': 500000,
        '供应商': '三一代理商',
        '校准到期日': '2025-01-15',
        '证书编号': 'CERT-001',
        '发证机构': '质量监督局',
        '技术参数': '功率200kW',
        '健康状态': '正常',
        '使用状态': '闲置',
        '仓库': '主仓库',
        '备注': '新采购设备'
      },
      {
        '设备名称': '发电机',
        '规格型号': 'GF-500',
        '设备类型': '仪表',
        '品牌': '康明斯',
        '制造商': '康明斯中国',
        '数量': 1,
        '单位': '台',
        '序列号': 'SN002',
        '管理编码': 'EQ-002',
        '采购日期': '2024-02-20',
        '采购价格': 300000,
        '供应商': '康明斯代理商',
        '校准到期日': '',
        '证书编号': '',
        '发证机构': '',
        '技术参数': '功率500kW',
        '健康状态': '正常',
        '使用状态': '使用中',
        '仓库': '主仓库',
        '备注': ''
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '设备导入模板');
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  generateAccessoryTemplate(): Buffer {
    const template = [
      {
        '配件名称': '电源线',
        '规格型号': 'AC-220V-3M',
        '配件类型': '电源',
        '品牌': '公牛',
        '数量': 10,
        '单位': '根',
        '序列号': '',
        '管理编码': 'ACC-001',
        '采购日期': '2024-01-15',
        '采购价格': 50,
        '供应商': '公牛电器',
        '健康状态': '正常',
        '使用状态': '闲置',
        '来源类型': '单独入库',
        '备注': '常用配件'
      },
      {
        '配件名称': '网线',
        '规格型号': 'CAT6-5M',
        '配件类型': '网络',
        '品牌': '绿联',
        '数量': 20,
        '单位': '根',
        '序列号': '',
        '管理编码': 'ACC-002',
        '采购日期': '2024-02-20',
        '采购价格': 30,
        '供应商': '绿联科技',
        '健康状态': '正常',
        '使用状态': '闲置',
        '来源类型': '单独入库',
        '备注': ''
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '配件导入模板');
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}

export const excelImportService = new ExcelImportService();
