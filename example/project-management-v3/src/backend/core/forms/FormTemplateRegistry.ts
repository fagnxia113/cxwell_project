import { singleton } from 'tsyringe';
import { UnifiedFormTemplate } from '../../services/UnifiedFormService.js';

/**
 * 表单模板注册中心接口
 */
export interface IFormTemplateRegistry {
  register(template: UnifiedFormTemplate): void;
  getAll(): UnifiedFormTemplate[];
  getByKey(key: string): UnifiedFormTemplate | undefined;
  getById(id: string): UnifiedFormTemplate | undefined;
  registerBatch(templates: UnifiedFormTemplate[]): void;
}

/**
 * 核心表单模板注册中心
 */
@singleton()
export class FormTemplateRegistry implements IFormTemplateRegistry {
  private templates: Map<string, UnifiedFormTemplate> = new Map();
  private keyMap: Map<string, string> = new Map();

  constructor() {}

  register(template: UnifiedFormTemplate): void {
    if (this.templates.has(template.id)) {
      console.warn(`[FormTemplateRegistry] 重复注册 ID 为 ${template.id} 的表单模板，原有模板将被覆盖`);
    }
    this.templates.set(template.id, template);
    this.keyMap.set(template.key, template.id);
    console.log(`[FormTemplateRegistry] 注册表单模板: ${template.name} (${template.key})`);
  }

  getAll(): UnifiedFormTemplate[] {
    return Array.from(this.templates.values());
  }

  getByKey(key: string): UnifiedFormTemplate | undefined {
    const id = this.keyMap.get(key);
    return id ? this.templates.get(id) : undefined;
  }

  getById(id: string): UnifiedFormTemplate | undefined {
    return this.templates.get(id);
  }

  registerBatch(templates: UnifiedFormTemplate[]): void {
    templates.forEach(t => this.register(t));
  }
}

// 导出单例用于过渡（或直接从容器获取）
import { container } from 'tsyringe';
export const formTemplateRegistry = container.resolve(FormTemplateRegistry);
