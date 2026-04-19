import { singleton } from 'tsyringe';
import { logger } from '../../utils/logger.js';

/**
 * 工作流副作用注册中心
 * 用于解耦业务逻辑与核心引擎，允许根据业务类型和事件类型注册回调
 */

export type SideEffectEvent = 
  | 'process.started' 
  | 'process.ended' 
  | 'task.created' 
  | 'task.completed' 
  | 'task.failed';

export type SideEffectHandler = (data: any) => Promise<void>;

@singleton()
export class WorkflowSideEffectRegistry {
  private handlers: Map<string, SideEffectHandler[]> = new Map();

  /**
   * 注册副作用处理程序
   * @param event 事件类型
   * @param businessKey 业务标识 (如 'equipment-inbound')
   * @param handler 处理函数
   */
  register(event: SideEffectEvent, businessKey: string, handler: SideEffectHandler): void {
    const key = `${event}:${businessKey}`;
    const list = this.handlers.get(key) || [];
    list.push(handler);
    this.handlers.set(key, list);
    logger.debug(`[SideEffectRegistry] 已注册处理程序: ${key}`);
  }

  /**
   * 执行副作用
   * @param event 事件类型
   * @param businessKey 业务标识
   * @param data 事件数据
   */
  async execute(event: SideEffectEvent, businessKey: string, data: any): Promise<void> {
    const key = `${event}:${businessKey}`;
    const list = this.handlers.get(key) || [];
    
    if (list.length === 0) {
      return;
    }

    logger.debug(`[SideEffectRegistry] 开始执行副作用: ${key}, 处理程序数量: ${list.length}`);
    
    for (const handler of list) {
      try {
        await handler(data);
      } catch (error) {
        logger.error(`[SideEffectRegistry] 执行副作用出错: ${key}`, error as Error);
        // 继续执行后续处理程序，不中断流程
      }
    }
  }
}

export const workflowSideEffectRegistry = new WorkflowSideEffectRegistry();
