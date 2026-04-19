import { singleton, container } from 'tsyringe';
import { ProcessContext } from './types.js';

/**
 * 服务任务处理器接口
 * 业务模块通过实现此接口来处理流程引擎触发的服务任务
 */
export interface IServiceTaskHandler {
  /**
   * 执行逻辑
   * @param context 流程上下文
   * @param config 节点配置的参数
   */
  execute(context: ProcessContext, config: any): Promise<any>;
}

/**
 * 服务任务处理器注册表
 */
@singleton()
export class TaskHandlerRegistry {
  private handlers: Map<string, IServiceTaskHandler>;

  constructor() {
    this.handlers = new Map();
  }

  /**
   * 注册处理器
   * @param type 处理器类型（如 'equipment_inbound'）
   * @param handler 处理器实现
   */
  public register(type: string, handler: IServiceTaskHandler): void {
    this.handlers.set(type, handler);
  }

  /**
   * 获取处理器
   */
  public getHandler(type: string): IServiceTaskHandler | undefined {
    return this.handlers.get(type);
  }
}

// 导出单例 (为了向后兼容)
export const taskHandlerRegistry = container.resolve(TaskHandlerRegistry);
