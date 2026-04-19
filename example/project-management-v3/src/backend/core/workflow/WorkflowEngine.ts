import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  WorkflowInstance,
  WorkflowTask,
  StartProcessParams,
  CompleteTaskParams,
  ProcessContext,
  WorkflowNode,
  WorkflowDefinition
} from './types.js';
import { definitionService } from '../../services/DefinitionService.js';
import { instanceService } from '../../services/InstanceService.js';
import { taskService } from '../../services/TaskService.js';
import { approverResolver } from '../../services/ApproverResolver.js';
import { gatewayHandler } from '../../services/GatewayHandler.js';
import { logger } from '../../utils/logger.js';
import { db } from '../../database/connection.js';
import { taskHandlerRegistry } from './interfaces.js';
import { eventBus } from '../events/EventBus.js';
import { singleton, container } from 'tsyringe';

// 流程引擎配置
interface WorkflowEngineConfig {
  maxListeners: number;
  cacheSize: number;
  cacheTTL: number;
  enablePerformanceMonitor: boolean;
  enableExecutionLog: boolean;
  retryAttempts: number;
  retryDelay: number;
}

// 缓存项
interface CacheItem<T> {
  value: T;
  timestamp: number;
}

// 默认配置
const defaultConfig: WorkflowEngineConfig = {
  maxListeners: 100,
  cacheSize: 1000,
  cacheTTL: 300000, // 5分钟
  enablePerformanceMonitor: true,
  enableExecutionLog: true,
  retryAttempts: 3,
  retryDelay: 1000
};

@singleton()
export class WorkflowEngine {
  private config: WorkflowEngineConfig;

  // 多层缓存
  private definitionCache: Map<string, CacheItem<any>> = new Map();
  private approverCache: Map<string, CacheItem<any[]>> = new Map();
  private nextNodesCache: Map<string, Map<string, string[]>> = new Map();

  // 性能指标
  private metrics = {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    avgExecutionTime: 0,
  };

  constructor(config: Partial<WorkflowEngineConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    
    // 启动缓存清理定时器
    this.startCacheCleanup();
  }

  // ==================== 流程启动 ====================

  async startProcess(params: StartProcessParams): Promise<WorkflowInstance> {
    const startTime = Date.now();
    const definition = await this.getCachedDefinition(params.processKey);
    
    // 对于新实例，使用分布式锁保护
    const instanceId = uuidv4(); 
    const lockKey = `workflow:instance:${instanceId}`;
    const lockOwner = `engine:${process.pid}`;

    if (!await instanceService.acquireLock(lockKey, lockOwner)) {
      throw new Error('无法获取流程启动锁');
    }

    try {
      this.metrics.totalExecutions++;
      
      const instance = await instanceService.createInstance({
        ...params,
        definitionId: definition.id
      });

      eventBus.emit('workflow.process.started', { instanceId: instance.id, instance, definition });
      
      // 执行开始节点
      await this.executeWithRetry(
        () => this.executeNode(instance, definition, this.getStartNode(definition).id),
        `start_process:${instance.id}`,
        'start_node'
      );

      this.updateMetrics(true, Date.now() - startTime);
      return instance;
    } catch (error: any) {
      this.updateMetrics(false, Date.now() - startTime);
      throw error;
    } finally {
      await instanceService.releaseLock(lockKey, lockOwner);
    }
  }

  // ==================== 任务完成 ====================

  async completeTask(taskId: string, params: CompleteTaskParams): Promise<void> {
    const startTime = Date.now();
    const task = await taskService.getTask(taskId);
    if (!task) throw new Error('任务不存在');

    const instanceId = task.instance_id;
    const lockKey = `workflow:instance:${instanceId}`;
    const lockOwner = `engine:${process.pid}`;

    if (!await instanceService.acquireLock(lockKey, lockOwner)) {
      throw new Error('当前流程实例正在处理中，请稍后再试');
    }

    try {
      // 在锁内重新获取任务状态，防止并发执行
      const currentTask = await taskService.getTask(taskId);
      if (!currentTask) throw new Error('任务不存在');
      if (currentTask.status === 'completed' || currentTask.status === 'cancelled') {
        logger.info(`任务 ${taskId} 已经处理过，忽略重复请求`);
        return;
      }

      const instance = await instanceService.getInstance(instanceId);
      if (!instance) throw new Error('实例不存在');

      const definition = await this.getCachedDefinitionById(instance.definition_id);
      
      eventBus.emit('workflow.task.completing', { taskId, params, instance });

      // 处理分步/并行审批逻辑
      const approvalMode = currentTask.variables?.approvalMode || 'or_sign';
      const voteThreshold = currentTask.variables?.voteThreshold || 1;
      const multiApproval = currentTask.variables?.multiApproval;

      if (multiApproval && approvalMode !== 'or_sign') {
        await this.handleMultiApproval(currentTask, instance, params, approvalMode, voteThreshold);
      } else {
        await taskService.completeTask(taskId, params);
        eventBus.emit('workflow.task.completed', { task, params });

        // 重要：重新获取实例状态，以包含刚合并的 formData 和变量
        const updatedInstance = await instanceService.getInstance(instanceId);
        if (!updatedInstance) throw new Error('无法刷新实例状态');

        // 如果驳回，结束流程
        if (params.action === 'reject') {
          await this.endInstance(updatedInstance.id, 'rejected');
        } else {
          // 找到下一个节点并执行
          const nextNodes = await this.findNextNodes(definition, task.node_id);
          for (const nextNodeId of nextNodes) {
            await this.executeNode(updatedInstance, definition, nextNodeId);
          }
        }
      }

      this.updateMetrics(true, Date.now() - startTime);
    } catch (error: any) {
      this.updateMetrics(false, Date.now() - startTime);
      throw error;
    } finally {
      await instanceService.releaseLock(lockKey, lockOwner);
    }
  }

  // ==================== 核心执行逻辑 ====================

  private async executeNode(instance: WorkflowInstance, definition: WorkflowDefinition, nodeId: string): Promise<void> {
    const node = definition.node_config.nodes.find(n => n.id === nodeId);
    if (!node) throw new Error(`节点 ${nodeId} 不存在`);

    logger.debug(`执行节点: ${node.name} (${node.type})`);
    eventBus.emit('workflow.node.executing', { instanceId: instance.id, nodeId, nodeType: node.type });

    try {
      switch (node.type) {
        case 'startEvent':
          const next = await this.findNextNodes(definition, nodeId);
          for (const mid of next) await this.executeNode(instance, definition, mid);
          break;
        case 'userTask':
          await this.executeUserTask(instance, definition, node);
          break;
        case 'serviceTask':
          await this.executeServiceTask(instance, definition, node);
          break;
        case 'exclusiveGateway':
          await this.executeExclusiveGateway(instance, definition, node);
          break;
        case 'parallelGateway':
          await this.executeParallelGateway(instance, definition, node);
          break;
        case 'inclusiveGateway':
          await this.executeInclusiveGateway(instance, definition, node);
          break;
        case 'endEvent':
          await this.endInstance(instance.id, 'approved');
          break;
        default:
          logger.warn(`未处理的节点类型: ${node.type}`);
      }
    } catch (error) {
      logger.error(`节点执行失败: ${node.name}`, error as Error);
      eventBus.emit('workflow.node.failed', { instanceId: instance.id, nodeId, error });
      throw error;
    }
  }

  // ==================== 节点具体处理 ====================

  private async executeUserTask(instance: WorkflowInstance, definition: WorkflowDefinition, node: WorkflowNode): Promise<void> {
    const context: ProcessContext = {
      process: instance,
      definition,
      variables: instance.variables,
      formData: instance.variables?.formData || {},
      initiator: { id: instance.initiator_id, name: instance.initiator_name }
    };

    const approvalConfig = node.config?.approvalConfig || node.approvalConfig;
    if (!approvalConfig) {
      // 如果没有配置审批，直接跳过到下一个节点
      const nextNodes = await this.findNextNodes(definition, node.id);
      for (const nextNodeId of nextNodes) {
        await this.executeNode(instance, definition, nextNodeId);
      }
      return;
    }

    const approvers = await this.resolveApproversWithCache(node, approvalConfig.approverSource, context);
    const approvalMode = (approvalConfig as any).approvalMode || 'or_sign';
    const voteThreshold = (approvalConfig as any).voteThreshold || 1;

    // 更新当前节点信息
    await this.updateCurrentNode(instance.id, node.id, node.name);

    if (approvers.length === 0) {
      // 无审批人，自动跳过
      const nextNodes = await this.findNextNodes(definition, node.id);
      for (const nextNodeId of nextNodes) {
        await this.executeNode(instance, definition, nextNodeId);
      }
      return;
    }

    if (approvers.length === 1 || approvalMode === 'or_sign') {
      const task = await taskService.createTask({
        instanceId: instance.id,
        nodeId: node.id,
        name: node.name,
        assigneeId: approvers[0].id,
        assigneeName: approvers[0].name,
        candidateUsers: approvers.slice(1).map(a => a.id),
        priority: 50,
        variables: {
          approvalType: approvalConfig.approvalType,
          approvalMode,
          voteThreshold
        }
      });
      eventBus.emit('workflow.task.created', task);
    } else {
      // 多人审批
      for (const approver of approvers) {
        const task = await taskService.createTask({
          instanceId: instance.id,
          nodeId: node.id,
          name: node.name,
          assigneeId: approver.id,
          assigneeName: approver.name,
          priority: 50,
          variables: {
            approvalType: approvalConfig.approvalType,
            approvalMode,
            voteThreshold,
            multiApproval: true
          }
        });
        eventBus.emit('workflow.task.created', task);
      }
    }
  }

  private async executeServiceTask(instance: WorkflowInstance, definition: WorkflowDefinition, node: WorkflowNode): Promise<void> {
    await this.updateCurrentNode(instance.id, node.id, node.name);
    const serviceType = node.config?.serviceType || node.id;
    const handler = taskHandlerRegistry.getHandler(serviceType);

    if (handler) {
      logger.info(`[WorkflowEngine] 执行服务任务: ${serviceType}`, { nodeId: node.id, instanceId: instance.id });
      const context: ProcessContext = {
        process: instance,
        definition,
        variables: instance.variables,
        formData: instance.variables?.formData || {},
        initiator: { id: instance.initiator_id, name: instance.initiator_name }
      };
      logger.info(`[WorkflowEngine] 构造的 context.formData 项数: ${Object.keys(context.formData || {}).length}`, { instanceId: instance.id });
      const result = await handler.execute(context, node.config?.serviceConfig);
      
      // 重要：处理服务任务返回的变量并持久化
      if (result && result.variables) {
        logger.info(`[WorkflowEngine] 服务任务返回了新变量，准备同步: ${Object.keys(result.variables).join(', ')}`);
        
        // 合并变量
        instance.variables = {
          ...instance.variables,
          ...result.variables,
          formData: {
            ...(instance.variables?.formData || {}),
            ...(result.variables.formData || {})
          }
        };

        // 持久化到数据库
        await instanceService.updateInstance(instance.id, {
          variables: instance.variables
        });
      }
    } else {
      logger.warn(`未找到服务任务处理器: ${serviceType}`);
    }

    const nextNodes = await this.findNextNodes(definition, node.id);
    for (const nextId of nextNodes) {
      await this.executeNode(instance, definition, nextId);
    }
  }

  private async executeExclusiveGateway(instance: WorkflowInstance, definition: WorkflowDefinition, node: WorkflowNode): Promise<void> {
    await this.updateCurrentNode(instance.id, node.id, node.name);
    const context: ProcessContext = {
      process: instance,
      definition,
      variables: instance.variables,
      formData: instance.variables?.formData || {},
      initiator: { id: instance.initiator_id, name: instance.initiator_name }
    };

    const targetNodes = await gatewayHandler.handleExclusiveGateway(node, context);
    for (const targetNodeId of targetNodes) {
      await this.executeNode(instance, definition, targetNodeId);
    }
  }

  private async executeParallelGateway(instance: WorkflowInstance, definition: WorkflowDefinition, node: WorkflowNode): Promise<void> {
    await this.updateCurrentNode(instance.id, node.id, node.name);
    const context: ProcessContext = {
      process: instance,
      definition,
      variables: instance.variables,
      formData: instance.variables?.formData || {},
      initiator: { id: instance.initiator_id, name: instance.initiator_name }
    };
    const targetNodes = await gatewayHandler.handleParallelGateway(node);
    for (const targetNodeId of targetNodes) {
      await this.executeNode(instance, definition, targetNodeId);
    }
  }

  private async executeInclusiveGateway(instance: WorkflowInstance, definition: WorkflowDefinition, node: WorkflowNode): Promise<void> {
    await this.updateCurrentNode(instance.id, node.id, node.name);
    const context: ProcessContext = {
      process: instance,
      definition,
      variables: instance.variables,
      formData: instance.variables?.formData || {},
      initiator: { id: instance.initiator_id, name: instance.initiator_name }
    };
    const targetNodes = await gatewayHandler.handleInclusiveGateway(node, context);
    for (const targetNodeId of targetNodes) {
      await this.executeNode(instance, definition, targetNodeId);
    }
  }

  // ==================== 管理员干预功能 ====================

  async terminateProcess(instanceId: string, reason: string, operator: { id: string; name: string }): Promise<void> {
    await this.cancelActiveTasks(instanceId, operator, reason);
    await instanceService.endInstance(instanceId, 'terminated', operator, reason);
    eventBus.emit('workflow.process.terminated', { instanceId, reason, operator });
  }

  async resumeProcess(instanceId: string, fromNodeId?: string): Promise<void> {
    const instance = await instanceService.getInstance(instanceId);
    if (!instance) throw new Error('实例不存在');
    
    // 如果实例处于暂停状态，恢复为 running
    if (instance.status === 'suspended') {
      await instanceService.updateInstanceStatus(instanceId, 'running');
    }

    const definition = await this.getCachedDefinitionById(instance.definition_id);
    const nodeId = fromNodeId || await this.findLastActiveNode(instanceId) || this.getStartNode(definition).id;
    await this.executeNode(instance, definition, nodeId);
    eventBus.emit('workflow.process.resumed', { instanceId, nodeId });
  }

  async suspendProcess(instanceId: string, operator: { id: string; name: string }, reason?: string): Promise<void> {
    const instance = await instanceService.getInstance(instanceId);
    if (!instance) throw new Error('实例不存在');
    if (instance.status !== 'running') throw new Error('只有运行中的流程可以暂停');

    await instanceService.updateInstanceStatus(instanceId, 'suspended', operator, reason);
    eventBus.emit('workflow.process.suspended', { instanceId, operator, reason });
  }

  async jumpToNode(instanceId: string, targetNodeId: string, operator: { id: string; name: string }, reason?: string): Promise<void> {
    const instance = await instanceService.getInstance(instanceId);
    if (!instance) throw new Error('实例不存在');
    const definition = await this.getCachedDefinitionById(instance.definition_id);
    await this.cancelActiveTasks(instanceId, operator, reason);
    await this.executeNode(instance, definition, targetNodeId);
    eventBus.emit('workflow.process.jumped', { instanceId, targetNodeId, operator, reason });
  }

  async rollbackToPreviousNode(instanceId: string, operator: { id: string; name: string }, reason?: string): Promise<void> {
    const instance = await instanceService.getInstance(instanceId);
    if (!instance) throw new Error('实例不存在');
    const currentNodeId = await this.findLastActiveNode(instanceId);
    if (!currentNodeId) throw new Error('未找到当前活动节点');
    const definition = await this.getCachedDefinitionById(instance.definition_id);
    const previousNodeId = this.findPreviousNode(definition, currentNodeId);
    if (!previousNodeId) throw new Error('未找到前一个节点');
    await this.cancelActiveTasks(instanceId, operator, reason);
    await this.executeNode(instance, definition, previousNodeId);
    eventBus.emit('workflow.process.rolled_back', { instanceId, fromNodeId: currentNodeId, toNodeId: previousNodeId, operator, reason });
  }

  async forceCompleteTask(taskId: string, result: 'approved' | 'rejected', operator: { id: string; name: string }, comment?: string): Promise<void> {
    const task = await taskService.getTask(taskId);
    if (!task) throw new Error('任务不存在');
    await taskService.completeTask(taskId, {
      action: result === 'approved' ? 'approve' : 'reject',
      comment: `[管理员强制${result === 'approved' ? '通过' : '拒绝'}] ${comment || ''}`,
      operator
    });
    const instance = await instanceService.getInstance(task.instance_id);
    if (instance) {
      if (result === 'rejected') await this.endInstance(instance.id, 'rejected');
      else {
        const definition = await this.getCachedDefinitionById(instance.definition_id);
        const nextNodes = await this.findNextNodes(definition, task.node_id);
        for (const nextNodeId of nextNodes) await this.executeNode(instance, definition, nextNodeId);
      }
    }
    eventBus.emit('workflow.task.force_completed', { taskId, result, operator });
  }

  async claimTask(taskId: string, userId: string, userName: string): Promise<void> {
    await taskService.claimTask(taskId, userId, userName);
    eventBus.emit('workflow.task.claimed', { taskId, userId, userName });
  }

  async transferTask(taskId: string, params: { targetUser: { id: string; name: string }; operator: { id: string; name: string }; comment?: string }): Promise<void> {
    await taskService.transferTask(taskId, params);
    eventBus.emit('workflow.task.transferred', { taskId, ...params });
  }

  async rollbackTask(taskId: string, targetNodeId: string, operator: { id: string; name: string }, comment?: string): Promise<void> {
    const task = await taskService.getTask(taskId);
    if (!task) throw new Error('任务不存在');
    const instance = await instanceService.getInstance(task.instance_id);
    if (!instance) throw new Error('实例不存在');
    const definition = await this.getCachedDefinitionById(instance.definition_id);
    await this.cancelActiveTasks(instance.id, operator, comment);
    await this.executeNode(instance, definition, targetNodeId);
    eventBus.emit('workflow.task.rolled_back', { taskId, targetNodeId, operator, comment });
  }

  async addSigner(taskId: string, operator: { id: string; name: string }, newSigners: { id: string; name: string }[], comment?: string): Promise<void> {
    await taskService.addSigner(taskId, operator, newSigners, comment);
    eventBus.emit('workflow.task.signer_added', { taskId, newSigners, operator, comment });
  }

  async forceCloseProcess(instanceId: string, operator: { id: string; name: string }, reason?: string): Promise<void> {
    await this.cancelActiveTasks(instanceId, operator, reason);
    await instanceService.endInstance(instanceId, 'terminated', operator, reason);
    eventBus.emit('workflow.process.force_closed', { instanceId, operator, reason });
  }

  async reassignTask(taskId: string, newAssignee: { id: string; name: string }, operator: { id: string; name: string }, reason?: string): Promise<void> {
    await taskService.reassignTask(taskId, newAssignee);
    eventBus.emit('workflow.task.reassigned', { taskId, newAssignee, operator, reason });
  }

  async delegateTask(taskId: string, params: { targetUser: { id: string; name: string }; operator: { id: string; name: string }; comment?: string }): Promise<void> {
    await taskService.delegateTask(taskId, params.targetUser, params.operator, params.comment);
    eventBus.emit('workflow.task.delegated', { taskId, ...params });
  }

  // ==================== 查询与统计 ====================

  async getProcessInstance(instanceId: string) { return instanceService.getInstance(instanceId); }
  async getAllInstances(params: any) { return instanceService.getAllInstances(params); }
  async getProcessStatistics(params: any) { return instanceService.getProcessStatistics(params); }
  async getRealtimeMonitoring() { return instanceService.getRealtimeMonitoring(); }
  async getTasksByInstance(instanceId: string) { return taskService.getTasksByInstance(instanceId); }
  async getTasksByAssignee(assigneeId: string, status?: string[]) { return taskService.getTasksByAssignee(assigneeId, status); }
  getMetrics() { return { ...this.metrics }; }
  async getProcessMetrics(processKey?: string) { return instanceService.getProcessStatistics({ processKey }); }
  getEventBus() { return eventBus; }
  clearCache() { this.definitionCache.clear(); this.approverCache.clear(); this.nextNodesCache.clear(); }

  // ==================== 辅助方法 ====================

  private getStartNode(definition: WorkflowDefinition): WorkflowNode {
    const node = definition.node_config.nodes.find(n => n.type === 'startEvent');
    if (!node) throw new Error('缺少开始节点');
    return node;
  }

  private async findNextNodes(definition: WorkflowDefinition, nodeId: string): Promise<string[]> {
    let definitionCache = this.nextNodesCache.get(definition.id);
    if (!definitionCache) {
      definitionCache = new Map();
      this.nextNodesCache.set(definition.id, definitionCache);
    }

    let nextNodes = definitionCache.get(nodeId);
    if (!nextNodes) {
      nextNodes = definition.node_config.edges
        .filter(e => e.source === nodeId)
        .map(e => e.target);
      definitionCache.set(nodeId, nextNodes);
    }
    return nextNodes;
  }

  private async getCachedDefinition(processKey: string): Promise<WorkflowDefinition> {
    const cacheKey = `key_${processKey}`;
    const cached = this.definitionCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
      return cached.value;
    }

    const definition = await definitionService.getLatestDefinition(processKey);
    if (!definition) throw new Error(`流程定义 ${processKey} 不存在`);

    this.definitionCache.set(cacheKey, { value: definition, timestamp: Date.now() });
    this.definitionCache.set(definition.id, { value: definition, timestamp: Date.now() });

    return definition;
  }

  private async getCachedDefinitionById(definitionId: string): Promise<WorkflowDefinition> {
    const cached = this.definitionCache.get(definitionId);

    if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
      return cached.value;
    }

    const definition = await definitionService.getDefinition(definitionId);
    if (!definition) throw new Error(`流程定义 ${definitionId} 不存在`);

    this.definitionCache.set(definitionId, { value: definition, timestamp: Date.now() });

    return definition;
  }

  private async resolveApproversWithCache(node: WorkflowNode, approverSource: any, context: ProcessContext): Promise<any[]> {
    const cacheKey = `${node.id}_${JSON.stringify(approverSource)}_${JSON.stringify(context.formData)}`;
    const cached = this.approverCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
      return cached.value;
    }

    const approvers = await approverResolver.resolveApprovers(approverSource, context);
    this.approverCache.set(cacheKey, { value: approvers, timestamp: Date.now() });
    return approvers;
  }

  private async updateCurrentNode(instanceId: string, nodeId: string, nodeName: string): Promise<void> {
    await db.update(
      `UPDATE workflow_instances SET current_node_id = ?, current_node_name = ? WHERE id = ?`,
      [nodeId, nodeName, instanceId]
    );
  }

  private async endInstance(instanceId: string, result: 'approved' | 'rejected' | 'terminated'): Promise<void> {
    await db.update(
      `UPDATE workflow_instances SET current_node_id = NULL, current_node_name = NULL WHERE id = ?`,
      [instanceId]
    );
    await instanceService.endInstance(instanceId, result);
    eventBus.emit('workflow.process.ended', { instanceId, result });
  }

  private async cancelActiveTasks(instanceId: string, operator: { id: string; name: string }, reason?: string): Promise<void> {
    const tasks = await taskService.getTasksByInstance(instanceId, ['created', 'assigned', 'in_progress']);
    for (const task of tasks) {
      await taskService.cancelTask(task.id, `[管理员干预] ${reason || ''}`);
    }
  }

  private async findLastActiveNode(instanceId: string): Promise<string | null> {
    const tasks = await taskService.getTasksByInstance(instanceId);
    const activeTask = tasks.find(t => ['created', 'assigned', 'in_progress'].includes(t.status));
    return activeTask?.node_id || null;
  }

  private findPreviousNode(definition: WorkflowDefinition, nodeId: string): string | null {
    const edge = definition.node_config.edges.find(e => e.target === nodeId);
    return edge?.source || null;
  }

  private async handleMultiApproval(task: WorkflowTask, instance: WorkflowInstance, params: CompleteTaskParams, approvalMode: string, voteThreshold: number): Promise<void> {
    // 多人审批处理逻辑
    await taskService.completeTask(task.id, params);
    
    const nodeId = task.node_id;
    const allTasks = await taskService.getTasksByInstance(instance.id, ['assigned', 'in_progress', 'completed']);
    const nodeTasks = allTasks.filter(t => t.node_id === nodeId);
    const completedTasks = nodeTasks.filter(t => t.status === 'completed');
    const approveCount = completedTasks.filter(t => t.result === 'approved').length;
    const rejectCount = completedTasks.filter(t => t.result === 'rejected').length;

    let shouldContinue = false;
    switch (approvalMode) {
      case 'and_sign':
        shouldContinue = completedTasks.length === nodeTasks.length && rejectCount === 0;
        break;
      case 'vote':
        shouldContinue = approveCount >= voteThreshold;
        break;
      default:
        shouldContinue = true;
    }

    if (rejectCount > 0) {
      await this.endInstance(instance.id, 'rejected');
      return;
    }

    if (shouldContinue) {
      const definition = await this.getCachedDefinition(instance.definition_id);
      const nextNodes = await this.findNextNodes(definition, nodeId);
      for (const nextNodeId of nextNodes) {
        await this.executeNode(instance, definition, nextNodeId);
      }
    }
  }

  private async executeWithRetry<T>(fn: () => Promise<T>, executionId: string, operation: string): Promise<T> {
    let attempts = 0;
    while (attempts < this.config.retryAttempts) {
      try {
        return await fn();
      } catch (error) {
        attempts++;
        if (attempts >= this.config.retryAttempts) throw error;
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempts));
      }
    }
    throw new Error(`${operation} 执行失败，已重试 ${attempts} 次`);
  }

  private updateMetrics(success: boolean, duration: number): void {
    if (success) this.metrics.successfulExecutions++;
    else this.metrics.failedExecutions++;
    this.metrics.avgExecutionTime = (this.metrics.avgExecutionTime * (this.metrics.totalExecutions - 1) + duration) / this.metrics.totalExecutions;
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, item] of this.definitionCache.entries()) {
        if (now - item.timestamp > this.config.cacheTTL) this.definitionCache.delete(key);
      }
      for (const [key, item] of this.approverCache.entries()) {
        if (now - item.timestamp > this.config.cacheTTL) this.approverCache.delete(key);
      }
    }, 60000);
  }
}

export const workflowEngine = container.resolve(WorkflowEngine);
