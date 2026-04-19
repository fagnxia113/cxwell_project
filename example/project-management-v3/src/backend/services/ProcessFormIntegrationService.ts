/**
 * 流程表单集成服务
 * 负责整合表单模板和流程模板，提供固化流程的预设配置
 * 确保表单与流程引擎的无缝集成
 */

import { unifiedFormService, UnifiedFormTemplate } from './UnifiedFormService.js';
import WorkflowTemplatesService from './WorkflowTemplates.js';
import { workflowEngine } from '../core/workflow/WorkflowEngine.js';
import { definitionService } from './DefinitionService.js';
import { instanceService } from './InstanceService.js';
import { inboundOrderServiceV2 as inboundOrderService } from './InboundOrderServiceV2.js';
import { transferOrderServiceV2 as transferOrderService } from './TransferOrderServiceV2.js';
import { equipmentRepairServiceV2 as equipmentRepairService } from './EquipmentRepairServiceV2.js';
import { equipmentScrapSaleServiceV2 as equipmentScrapSaleService } from './EquipmentScrapSaleServiceV2.js';
import { ScrapSaleUseCase } from '../modules/equipment/application/ScrapSaleUseCase.js';
import { container } from 'tsyringe';
import { formDataValidator } from './FormDataValidator.js';
import { db } from '../database/connection.js';
import { notificationService } from './NotificationService.js';

interface ProcessFormPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  formTemplateKey: string;
  workflowTemplateId: string;
  businessType: string;
  status: 'active' | 'inactive';
  defaultVariables: Record<string, any>;
  version: string;
}

interface StartProcessWithFormParams {
  presetId: string;
  formData: Record<string, any>;
  businessKey?: string;
  businessId?: string;
  title?: string;
  initiator: {
    id: string;
    name: string;
  };
  additionalVariables?: Record<string, any>;
}

interface ProcessFormIntegrationResult {
  success: boolean;
  message: string;
  data?: {
    processInstanceId?: string;
    formValidation?: {
      isValid: boolean;
      errors: Array<{ field: string; message: string }>;
    };
  };
}

/**
 * 流程表单集成服务类
 */
export class ProcessFormIntegrationService {
  private presets: Map<string, ProcessFormPreset>;
  private categoryToPresetsMap: Map<string, ProcessFormPreset[]>;
  private db: typeof db;

  constructor() {
    this.presets = new Map();
    this.categoryToPresetsMap = new Map();
    this.db = db;
    this.initializeDefaultPresets();
  }

  /**
   * 初始化默认流程表单预设
   */
  private initializeDefaultPresets() {
    const defaultPresets: ProcessFormPreset[] = [
      {
        id: 'preset-project-approval',
        name: '项目审批流程',
        category: 'project',
        description: '项目立项、变更、结项审批流程',
        formTemplateKey: 'project-create-form',
        workflowTemplateId: 'project-approval',
        businessType: 'Project',
        status: 'active',
        defaultVariables: {},
        version: '1.0.0'
      },
      {
        id: 'preset-equipment-inbound',
        name: '设备入库流程',
        category: 'equipment',
        description: '设备入库审批流程',
        formTemplateKey: 'equipment-inbound-form',
        workflowTemplateId: 'equipment-inbound',
        businessType: 'EquipmentInbound',
        status: 'active',
        defaultVariables: {},
        version: '1.0.0'
      },
      {
        id: 'preset-equipment-transfer',
        name: '设备调拨流程',
        category: 'equipment',
        description: '设备调拨审批流程',
        formTemplateKey: 'equipment-transfer-form',
        workflowTemplateId: 'equipment-transfer',
        businessType: 'EquipmentTransfer',
        status: 'active',
        defaultVariables: {},
        version: '1.0.0'
      },
      {
        id: 'preset-equipment-repair',
        name: '设备维修流程',
        category: 'equipment',
        description: '设备维修申请及流程控制',
        formTemplateKey: 'equipment-repair-form',
        workflowTemplateId: 'equipment-repair',
        businessType: 'EquipmentRepair',
        status: 'active',
        defaultVariables: {},
        version: '1.0.0'
      },
      {
        id: 'preset-equipment-scrap-sale',
        name: '设备报废/售出流程',
        category: 'equipment',
        description: '设备报废或售出申请流程',
        formTemplateKey: 'equipment-scrap-sale-form',
        workflowTemplateId: 'equipment-scrap-sale',
        businessType: 'EquipmentScrapSale',
        status: 'active',
        defaultVariables: {},
        version: '1.0.0'
      },
      {
        id: 'preset-milestone-approval',
        name: '里程碑审批流程',
        category: 'project',
        description: '项目里程碑设定与变更审批流程',
        formTemplateKey: 'milestone-approval-form',
        workflowTemplateId: 'milestone-approval',
        businessType: 'Project',
        status: 'active',
        defaultVariables: {},
        version: '1.0.0'
      }
    ];

    defaultPresets.forEach(preset => {
      this.presets.set(preset.id, preset);

      const categoryPresets = this.categoryToPresetsMap.get(preset.category) || [];
      categoryPresets.push(preset);
      this.categoryToPresetsMap.set(preset.category, categoryPresets);
    });
  }

  getAllPresets(): ProcessFormPreset[] {
    return this.getPresets();
  }

  getPresetsByCategory(category: string): ProcessFormPreset[] {
    return this.getPresets(category);
  }

  getPresetsByBusinessType(businessType: string): ProcessFormPreset[] {
    return Array.from(this.presets.values()).filter(p => p.businessType === businessType);
  }

  getPresetById(id: string): ProcessFormPreset | undefined {
    return this.getPreset(id);
  }

  getFormTemplate(key: string): UnifiedFormTemplate | undefined {
    return unifiedFormService.getTemplateByKey(key);
  }

  // 管理功能实现 (Stubs for compatibility)
  createPreset(data: any): ProcessFormPreset {
    const id = `preset-${Date.now()}`;
    const preset = { ...data, id, version: '1.0.0' } as ProcessFormPreset;
    this.presets.set(id, preset);
    return preset;
  }

  updatePreset(id: string, data: any): boolean {
    if (!this.presets.has(id)) return false;
    this.presets.set(id, { ...this.presets.get(id)!, ...data });
    return true;
  }

  deletePreset(id: string): boolean {
    return this.presets.delete(id);
  }

  activatePreset(id: string): boolean {
    const preset = this.presets.get(id);
    if (!preset) return false;
    preset.status = 'active';
    return true;
  }

  deactivatePreset(id: string): boolean {
    const preset = this.presets.get(id);
    if (!preset) return false;
    preset.status = 'inactive';
    return true;
  }

  private async getLocationInfo(formData: Record<string, any>) {
    try {
      const { fromLocationType, fromLocationId, toLocationType, toLocationId } = formData;
      const result: any = {};

      if (fromLocationType === 'warehouse') {
        const warehouse = await this.db.query('SELECT id, name, manager_id FROM warehouses WHERE id = ?', [fromLocationId]) as any[];
        if (warehouse && warehouse.length > 0) {
          result.from_manager_id = warehouse[0].manager_id;
          result.fromManagerId = warehouse[0].manager_id;
          result.from_warehouse_id = warehouse[0].id;
          result.from_warehouse_name = warehouse[0].name;
          result._fromLocationName = warehouse[0].name;
          if (warehouse[0].manager_id) {
            const manager = await this.db.query('SELECT name FROM employees WHERE id = ?', [warehouse[0].manager_id]) as any[];
            if (manager && manager.length > 0) {
              result.from_manager = manager[0].name;
              result._fromManagerName = manager[0].name;
            }
          }
        }
      } else if (fromLocationType === 'project') {
        const project = await this.db.query('SELECT id, name, manager_id FROM projects WHERE id = ?', [fromLocationId]) as any[];
        if (project && project.length > 0) {
          result.from_manager_id = project[0].manager_id;
          result.fromManagerId = project[0].manager_id;
          result.from_project_id = project[0].id;
          result.from_project_name = project[0].name;
          result._fromLocationName = project[0].name;
          if (project[0].manager_id) {
            const manager = await this.db.query('SELECT name FROM employees WHERE id = ?', [project[0].manager_id]) as any[];
            if (manager && manager.length > 0) {
              result.from_manager = manager[0].name;
              result._fromManagerName = manager[0].name;
            }
          }
        }
      }

      if (toLocationType === 'warehouse') {
        const warehouse = await this.db.query('SELECT id, name, manager_id FROM warehouses WHERE id = ?', [toLocationId]) as any[];
        if (warehouse && warehouse.length > 0) {
          result.to_manager_id = warehouse[0].manager_id;
          result.toManagerId = warehouse[0].manager_id;
          result.to_warehouse_id = warehouse[0].id;
          result.to_warehouse_name = warehouse[0].name;
          result._toLocationName = warehouse[0].name;
          if (warehouse[0].manager_id) {
            const manager = await this.db.query('SELECT name FROM employees WHERE id = ?', [warehouse[0].manager_id]) as any[];
            if (manager && manager.length > 0) {
              result.to_manager = manager[0].name;
              result._toManagerName = manager[0].name;
            }
          }
        }
      } else if (toLocationType === 'project') {
        const project = await this.db.query('SELECT id, name, manager_id FROM projects WHERE id = ?', [toLocationId]) as any[];
        if (project && project.length > 0) {
          result.to_manager_id = project[0].manager_id;
          result.toManagerId = project[0].manager_id;
          result.to_project_id = project[0].id;
          result.to_project_name = project[0].name;
          result._toLocationName = project[0].name;
          if (project[0].manager_id) {
            const manager = await this.db.query('SELECT name FROM employees WHERE id = ?', [project[0].manager_id]) as any[];
            if (manager && manager.length > 0) {
              result.to_manager = manager[0].name;
              result._toManagerName = manager[0].name;
            }
          }
        }
      }

      return result;
    } catch (error) {
      console.error('[ProcessFormIntegrationService] 获取位置详情失败:', error);
      return {};
    }
  }

  /**
   * 按位置获取管理员 ID
   */
  private async getManagerByLocation(type: string, id: string): Promise<string | null> {
    try {
      if (type === 'warehouse') {
        const rows = await this.db.query<any>('SELECT manager_id FROM warehouses WHERE id = ?', [id]);
        return rows && rows.length > 0 ? rows[0].manager_id : null;
      } else if (type === 'project') {
        const rows = await this.db.query<any>('SELECT manager_id FROM projects WHERE id = ?', [id]);
        return rows && rows.length > 0 ? rows[0].manager_id : null;
      }
      return null;
    } catch (error) {
      console.error('[ProcessFormIntegrationService] 获取位置管理员失败:', error);
      return null;
    }
  }

  /**
   * 启动流程并关联表单
   */
  async startProcessWithForm(params: StartProcessWithFormParams): Promise<ProcessFormIntegrationResult> {
    try {
      const preset = this.presets.get(params.presetId);
      if (!preset) {
        return { success: false, message: '流程预设不存在' };
      }

      // 验证表单数据
      const formFields = await this.getFormFields(params.presetId, 'start');
      const validationResult = formDataValidator.sanitizeFormData(params.formData, formFields);
      if (!validationResult.isValid) {
        return {
          success: false,
          message: '表单数据验证失败',
          data: { formValidation: { isValid: false, errors: validationResult.errors } }
        };
      }

      // 清理表单数据（使用验证后的数据）
      // 使用扩展运算符创建一个新对象，避免修改冻结的对象或触发不期望的引用共享
      const cleanedFormData = { ...validationResult.sanitizedData };

      // 将原始表单数据中不在清理后数据中的字段合并进来（如 items, estimatedArrivalDate 等）
      // 这对于非动态表单（如设备调拨这种在页面上硬编码表单项和数据结构的业务）非常重要
      for (const key of Object.keys(params.formData)) {
        if (!(key in cleanedFormData)) {
          cleanedFormData[key] = params.formData[key];
        }
      }

      // 准备流程变量
      const variables = {
        ...preset.defaultVariables,
        ...params.additionalVariables,
        formData: cleanedFormData,
        businessType: preset.businessType
      };

      // 业务ID，默认为传入的ID或生成一个临时的
      let businessId = params.businessId;

      // 特殊业务处理逻辑 - 启动前处理
      if (preset.businessType === 'EquipmentTransfer') {
        const locationInfo = await this.getLocationInfo(cleanedFormData);
        Object.assign(variables, locationInfo);
        Object.assign(cleanedFormData, locationInfo);
        
        // 创建真实的调拨单，从而获得有效的 businessId
        try {
          const order = await transferOrderService.createTransferOrder(
            cleanedFormData as any, 
            cleanedFormData.items || []
          );
          if (order && order.id) {
            businessId = order.id;
            cleanedFormData.transferOrderId = order.id;
          }
        } catch (orderError) {
          console.error('[ProcessFormIntegrationService] 创建调拨单失败:', orderError);
          throw new Error(`创建调拨单失败: ${orderError instanceof Error ? orderError.message : '未知错误'}`);
        }
      } else if (preset.businessType === 'EquipmentInbound') {
        try {
          const order = await inboundOrderService.createInboundOrder(
            cleanedFormData as any,
            params.initiator.id,
            params.initiator.name
          );
          if (order && order.id) {
            businessId = order.id;
            cleanedFormData.inboundOrderId = order.id;
          }
        } catch (error) {
          console.error('[ProcessFormIntegrationService] 入库单创建失败:', error);
          throw new Error(`创建入库单失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }

      // 启动流程实例（通过流程引擎启动，以确保执行开始节点并创建任务）
      const instance = await workflowEngine.startProcess({
        processKey: preset.workflowTemplateId,
        businessKey: params.businessKey || `BF-${Date.now()}`,
        businessId: businessId,
        title: params.title || preset.name,
        variables,
        initiator: params.initiator
      });

      // 后置业务处理逻辑
      if (preset.businessType === 'EquipmentRepair') {
        try {
          const orders = await equipmentRepairService.createBatchRepairOrders(
            cleanedFormData as any,
            params.initiator.id,
            params.initiator.name
          );
          if (orders && orders.length > 0) {
            await instanceService.updateInstance(instance.id, { business_id: orders[0].id });
          }
        } catch (error) {
          console.error('[ProcessFormIntegrationService] 维修单创建失败:', error);
        }
      } else if (preset.businessType === 'EquipmentScrapSale') {
        try {
          // 启动前先解析位置管理员 (如果前端没传过来)
          if (!cleanedFormData.location_manager_id && cleanedFormData.location_type && cleanedFormData.location_id) {
            const managerId = await this.getManagerByLocation(cleanedFormData.location_type, cleanedFormData.location_id);
            if (managerId) cleanedFormData.location_manager_id = managerId;
          }

          const scrapSaleUseCase = container.resolve(ScrapSaleUseCase);
          const order = await scrapSaleUseCase.createOrder(
            cleanedFormData as any,
            params.initiator.id,
            params.initiator.name
          );
          if (order && order.id) {
            businessId = order.id;
            cleanedFormData.scrapSaleOrderId = order.id;
          }
        } catch (error) {
          console.error('[ProcessFormIntegrationService] 报废/出售单创建失败:', error);
          throw new Error(`创建报废单失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }

      return {
        success: true,
        message: '流程启动成功',
        data: {
          processInstanceId: instance.id,
          formValidation: validationResult
        }
      };
    } catch (error) {
      console.error('启动流程失败:', error);
      return {
        success: false,
        message: `流程启动失败: ${(error as Error).message}`
      };
    }
  }

  /**
   * 获取流程表单的默认值
   */
  getFormDefaultValues(presetId: string): Record<string, any> {
    const preset = this.presets.get(presetId);
    if (!preset) return {};

    const formTemplate = unifiedFormService.getTemplateByKey(preset.formTemplateKey);
    if (!formTemplate) return {};

    return unifiedFormService.getDefaultValues(formTemplate.id);
  }

  /**
   * 获取流程表单的字段定义
   */
  async getFormFields(presetId: string, nodeId?: string): Promise<any[]> {
    const preset = this.presets.get(presetId);
    if (!preset) return [];

    const formTemplate = unifiedFormService.getTemplateByKey(preset.formTemplateKey);
    if (!formTemplate) return [];

    // 获取工作流模板中的字段定义（如果有）
    const workflowTemplate = WorkflowTemplatesService.getTemplateById(preset.workflowTemplateId);

    // 如果工作流模板有预设字段，则使用工作流模板的字段，否则使用表单模板的字段
    let fields = workflowTemplate && workflowTemplate.formSchema && workflowTemplate.formSchema.length > 0
      ? (workflowTemplate.formSchema as any[])
      : formTemplate.fields;

    // 如果指定了节点ID，则根据 visibleOn 进行过滤
    if (nodeId && fields && fields.length > 0) {
      fields = fields.filter(field => {
        // 如果字段没有 visibleOn 属性，默认可见（向后兼容）
        if (!field.visibleOn || !Array.isArray(field.visibleOn)) return true;
        // 检查当前节点是否在可见列表中
        return field.visibleOn.includes(nodeId);
      });
    }

    return fields;
  }

  /**
   * 获取所有可用的流程预设
   */
  getPresets(category?: string): ProcessFormPreset[] {
    if (category) {
      return this.categoryToPresetsMap.get(category) || [];
    }
    return Array.from(this.presets.values());
  }

  /**
   * 获取单个流程预设
   */
  getPreset(id: string): ProcessFormPreset | undefined {
    return this.presets.get(id);
  }

  /**
   * 同步流程定义和表单模板到数据库
   */
  async syncProcessFormTemplates(): Promise<void> {
    try {
      console.log('[ProcessFormIntegrationService] 开始同步预设流程模板...');
      const presets = Array.from(this.presets.values());
      let syncedCount = 0;

      for (const preset of presets) {
        // 查找工作流定义
        const workflowTemplate = WorkflowTemplatesService.getTemplateById(preset.workflowTemplateId);
        if (workflowTemplate) {
          const existing = await definitionService.getDefinitionByKey(workflowTemplate.id);
          if (!existing) {
             await definitionService.createDefinition({
               key: workflowTemplate.id,
               name: workflowTemplate.name,
               category: workflowTemplate.category,
               entity_type: workflowTemplate.entityType,
               nodes: workflowTemplate.definition.nodes,
               edges: workflowTemplate.definition.edges,
               form_schema: workflowTemplate.formSchema
             });
             syncedCount++;
          }
        }
      }
      
      console.log(`[ProcessFormIntegrationService] 预设流程同步完成，新增 ${syncedCount} 个定义`);
    } catch (error) {
      console.error('[ProcessFormIntegrationService] 同步流程模板失败:', error);
      throw error;
    }
  }
}

export const processFormIntegrationService = new ProcessFormIntegrationService();
