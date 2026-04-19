import { EventEmitter } from 'events';

/**
 * 跨模块事件总线
 * 用于解耦“内核(Kernel)”与“业务模块(Modules)”之间的通讯
 */
export class EventBus {
  private static instance: EventBus;
  private emitter: EventEmitter;

  private constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100);
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * 发布事件
   * @param event 事件名称
   * @param data 负载数据
   */
  public emit(event: string, data: any): void {
    this.emitter.emit(event, data);
  }

  /**
   * 订阅事件
   * @param event 事件名称
   * @param handler 处理函数
   */
  public on(event: string, handler: (data: any) => void): void {
    this.emitter.on(event, handler);
  }

  /**
   * 订阅一次性事件
   */
  public once(event: string, handler: (data: any) => void): void {
    this.emitter.once(event, handler);
  }

  /**
   * 取消订阅
   */
  public off(event: string, handler: (data: any) => void): void {
    this.emitter.off(event, handler);
  }

  public listenerCount(event: string): number {
    return this.emitter.listenerCount(event);
  }

  public eventNames(): (string | symbol)[] {
    return this.emitter.eventNames();
  }

  public getMaxListeners(): number {
    return this.emitter.getMaxListeners();
  }
}

export const eventBus = EventBus.getInstance();
