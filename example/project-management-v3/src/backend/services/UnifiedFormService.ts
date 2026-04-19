/**
 * 统一表单管理服务
 * 整合现有业务模块的表单结构，提供统一的表单定义、渲染和验证机制
 * 支持与业务数据的联动，确保表单内容与现有数据一致
 */

import { singleton } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';
import { formDependencyProcessor } from './FormDependencyProcessor.js';
import { formTemplateRegistry } from '../core/forms/FormTemplateRegistry.js';
import { db } from '../database/connection.js';

export type BusinessModule = 'project' | 'equipment' | 'personnel' | 'customer' | 'warehouse' | 'task' | 'organization' | 'attendance' | 'finance' | 'workflow';

export type FormFieldType = 'text' | 'textarea' | 'number' | 'date' | 'datetime' | 'select' | 'boolean' | 'array' | 'user' | 'lookup' | 'images' | 'files';

export interface UnifiedFormField {
  id?: string;
  name: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  defaultValue?: any;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  options?: Array<{ label: string; value: any }>;
  dynamicOptions?: string;
  cascadeFrom?: string;
  itemFields?: UnifiedFormField[];
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
  rows?: number;
  validation?: {
    pattern?: string;
    message?: string;
  };
  dependencies?: any[];
  visibleOn?: string[];
  editableOn?: string[];
  arrayConfig?: {
    modalSelector?: boolean;
    fields?: UnifiedFormField[];
  };
  multiple?: boolean;
  businessConfig?: {
    module?: string;
    entityType?: string;
    lookupField?: string;
    displayField?: string;
    filter?: Record<string, any>;
    autoFill?: boolean;
  };
}

export interface UnifiedFormTemplate {
  id: string;
  key: string;
  name: string;
  description: string;
  module: BusinessModule;
  businessEntityType: string;
  fields: UnifiedFormField[];
  status: 'active' | 'archived' | 'draft';
  category?: string;
  createdBy?: string;
  version: number;
  workflowTemplateId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Array<{ field: string; message: string }>;
}

export interface FormBusinessLinkResult {
  success: boolean;
  data: Record<string, any>;
  messages: string[];
}

/**
 * 统一表单管理服务类
 * 现在的实现已重构为基于注册中心（FormTemplateRegistry）的动态架构
 */
export class UnifiedFormService {
  constructor() {
    // 基础映射现在交由 FormTemplateRegistry 处理
  }

  /**
   * 按 ID 获取模板
   */
  getTemplateById(id: string): UnifiedFormTemplate | undefined {
    return formTemplateRegistry.getById(id);
  }

  /**
   * 按 Key 获取模板
   */
  getTemplateByKey(key: string): UnifiedFormTemplate | undefined {
    return formTemplateRegistry.getByKey(key);
  }

  /**
   * 获取所有模板
   */
  getAllTemplates(): UnifiedFormTemplate[] {
    return formTemplateRegistry.getAll();
  }

  /**
   * 按模块获取模板
   */
  getTemplatesByModule(module: BusinessModule): UnifiedFormTemplate[] {
    return formTemplateRegistry.getAll().filter(t => t.module === module);
  }

  /**
   * 按实体类型获取模板
   */
  getTemplatesByEntityType(entityType: string): UnifiedFormTemplate[] {
    return formTemplateRegistry.getAll().filter(t => t.businessEntityType === entityType);
  }

  /**
   * 创建表单模板 (动态注册)
   */
  createTemplate(template: Omit<UnifiedFormTemplate, 'id' | 'version' | 'createdAt' | 'updatedAt'>): UnifiedFormTemplate {
    const id = uuidv4();
    const version = 1;
    const now = new Date().toISOString();

    const newTemplate: UnifiedFormTemplate = {
      ...template,
      id,
      version,
      createdAt: now,
      updatedAt: now
    };

    formTemplateRegistry.register(newTemplate);
    return newTemplate;
  }

  updateTemplate(id: string, updates: Partial<UnifiedFormTemplate>): boolean {
    const existing = formTemplateRegistry.getById(id);
    if (!existing) return false;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    formTemplateRegistry.register(updated);
    return true;
  }

  deleteTemplate(id: string): boolean {
    // 注册中心通常没有删除，这里可以实现为状态变更或从Map中移除（如果底层支持）
    // 暂时实现为状态变更为 archived
    const existing = formTemplateRegistry.getById(id);
    if (!existing) return false;
    this.updateTemplate(id, { status: 'archived' });
    return true;
  }

  /**
   * 验证表单数据
   */
  validateForm(templateId: string, data: Record<string, any>): FormValidationResult {
    const template = formTemplateRegistry.getById(templateId);
    if (!template) {
      return {
        isValid: false,
        errors: [{ field: 'template', message: '表单模板不存在' }]
      };
    }

    const errors: { field: string; message: string }[] = [];

    template.fields.forEach(field => {
      const isVisible = this.isFieldVisible(field, data);
      if (!isVisible) return;

      const value = data[field.name];

      if (field.required && !this.hasValue(value)) {
        errors.push({ field: field.name, message: `${field.label}是必填字段` });
        return;
      }

      if (this.hasValue(value)) {
        if (!this.validateType(value, field.type)) {
          errors.push({ field: field.name, message: `${field.label}类型不正确` });
        }
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  private hasValue(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (Array.isArray(value)) return value.length > 0;
    return true;
  }

  private validateType(value: any, type: FormFieldType): boolean {
    switch (type) {
      case 'text':
      case 'textarea':
      case 'user':
      case 'lookup':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'date':
        return !isNaN(new Date(value).getTime());
      case 'boolean':
        return typeof value === 'boolean';
      default:
        return true;
    }
  }

  private isFieldVisible(field: UnifiedFormField, data: Record<string, any>): boolean {
    return formDependencyProcessor.isFieldVisible(field.name, field.dependencies, data);
  }

  /**
   * 获取字段的评估顺序
   */
  getFieldsByEvaluationOrder(templateId: string, data: Record<string, any>) {
    const template = formTemplateRegistry.getById(templateId);
    if (!template) return [];

    return formDependencyProcessor.getFieldsByEvaluationOrder(template.fields, data);
  }

  /**
   * 处理业务数据联动
   */
  async handleBusinessLink(templateId: string, data: Record<string, any>): Promise<FormBusinessLinkResult> {
    let template = formTemplateRegistry.getById(templateId);
    if (!template) {
      // 尝试按 Key 获取
      const templateByKey = formTemplateRegistry.getByKey(templateId);
      if (templateByKey) {
        return this.handleBusinessLink(templateByKey.id, data);
      }
    }

    let fields: any[] = [];
    if (template) {
      fields = template.fields;
    } else {
      // 进一步尝试从流程定义中获取 form_schema
      try {
        const { definitionService } = await import('./DefinitionService.js');
        const definition = await definitionService.getLatestDefinition(templateId);
        if (definition && definition.form_schema) {
          fields = definition.form_schema;
        }
      } catch (err) {
        console.error('[UnifiedFormService] 获取流程定义表单失败:', err);
      }
    }

    if (fields.length === 0) {
      return { success: false, data, messages: ['表单模板或流程定义不存在'] };
    }

    const messages: string[] = [];
    const linkedData = { ...data };

    // 搜索表单中的所有字段
    for (const field of fields) {
      // 如果字段标记为 autoFill，则检查是否满足其规则
      if (field.businessConfig?.autoFill) {
        // --- 位置选择联动 (调拨、维修等通用) ---
        if (field.name === 'location_id' || field.name === 'fromLocationId' || field.name === 'from_warehouse_id') {
          const locId = linkedData[field.name];
          if (locId) {
            try {
              const locType = linkedData.location_type || linkedData.fromLocationType || linkedData.from_location_type || 'warehouse';
              const table = locType === 'project' ? 'projects' : 'warehouses';
              const res = await db.queryOne<any>(`
                SELECT l.manager_id, l.manager_name, e.id as employee_id, e.user_id as manager_user_id, u.id as user_table_id
                FROM ${table} l 
                LEFT JOIN employees e ON (l.manager_id = e.id OR l.manager_id = e.employee_id)
                LEFT JOIN users u ON l.manager_id = u.id
                WHERE l.id = ?`, [locId]);
              
              if (res) {
                // 优先返回 employee.id，因为前端 userMap 映射了 employees.id -> name
                // 如果 manager_id 是 employee.id，直接使用
                // 如果 manager_id 是 employee.employee_id，使用关联的 employee.id
                const managerId = res.employee_id || res.manager_id;
                linkedData.location_manager_id = managerId;
                linkedData.location_manager_name = res.manager_name;
                linkedData.fromManagerId = managerId;
                linkedData.from_manager_id = managerId;
              }
            } catch (e) {
              console.error('Error auto-filling location manager:', e);
            }
          }
        }
        
        if (field.name === 'toLocationId' || field.name === 'to_warehouse_id') {
          const locId = linkedData[field.name];
          if (locId) {
            try {
              const locType = linkedData.toLocationType || linkedData.to_location_type || 'warehouse';
              const table = locType === 'project' ? 'projects' : 'warehouses';
              const res = await db.queryOne<any>(`
                SELECT l.manager_id, e.user_id as manager_user_id 
                FROM ${table} l 
                LEFT JOIN employees e ON l.manager_id = e.id 
                WHERE l.id = ?`, [locId]);
              
              if (res) {
                const managerId = res.manager_user_id || res.manager_id;
                linkedData.toLocationId = locId;
                linkedData.toManagerId = managerId;
                linkedData.to_manager_id = managerId;
              }
            } catch (e) {
              console.error('Error auto-filling to location manager:', e);
            }
          }
        }

        // --- 设备选择联动 (维修等) ---
        if (field.name === 'equipment_id') {
          const eqId = linkedData[field.name];
          if (eqId) {
            try {
              // 优先从设备实例检索
              const eq = await db.queryOne<any>(`
                SELECT equipment_name, category, model_no, brand 
                FROM equipment_instances 
                WHERE id = ?`, [eqId]);
              
              if (eq) {
                linkedData.equipment_name = eq.equipment_name;
                linkedData.equipment_category = eq.category;
                linkedData.model_no = eq.model_no;
                linkedData.brand = eq.brand;
              } else {
                // 后选配件实例检索
                const acc = await db.queryOne<any>(`
                  SELECT accessory_name as equipment_name, category, model_no, brand 
                  FROM equipment_accessory_instances 
                  WHERE id = ?`, [eqId]);
                if (acc) {
                  linkedData.equipment_name = acc.equipment_name;
                  linkedData.equipment_category = acc.category;
                  linkedData.model_no = acc.model_no;
                  linkedData.brand = acc.brand;
                }
              }
            } catch (e) {
              console.error('Error auto-filling equipment details:', e);
            }
          }
        }
      }
    }

    return { success: true, data: linkedData, messages };
  }

  /**
   * 获取表单模板建议
   */
  getFormTemplateSuggestions(module: BusinessModule): UnifiedFormTemplate[] {
    return formTemplateRegistry.getAll()
      .filter(t => t.module === module && t.status === 'active');
  }
  /**
   * 获取表单模板的默认值
   */
  getDefaultValues(templateId: string): Record<string, any> {
    const template = formTemplateRegistry.getById(templateId);
    if (!template) return {};

    const defaultValues: Record<string, any> = {};
    template.fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        defaultValues[field.name] = field.defaultValue;
      }
    });

    return defaultValues;
  }
}

// 导出单例
export const unifiedFormService = new UnifiedFormService();
