import { Injectable } from '@nestjs/common';

/**
 * 数据填充处理器
 */
@Injectable()
export class DataFillHandler {
  /**
   * 填充流程变量
   * @param variables 原始变量
   * @param instanceId 流程实例ID
   * @returns 填充后的变量
   */
  async fillVariables(variables: any, instanceId: bigint): Promise<any> {
    // 默认实现，可在子类中重写
    return variables;
  }

  /**
   * 填充任务数据
   * @param taskData 任务数据
   * @param instanceId 流程实例ID
   * @returns 填充后的任务数据
   */
  async fillTaskData(taskData: any, instanceId: bigint): Promise<any> {
    // 默认实现，可在子类中重写
    return taskData;
  }
}