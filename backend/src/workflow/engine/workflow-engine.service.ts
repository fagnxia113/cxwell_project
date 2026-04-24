import { Injectable, BadRequestException, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../../modules/notification/notification.service';
import { EmployeeOnboardingHandler } from '../handlers/employee-onboarding.handler';
import { ProjectApprovalHandler } from '../handlers/project-approval.handler';
import { ProjectCompletionHandler } from '../handlers/project-completion.handler';
import { ExpenseSyncHandler } from '../handlers/expense-sync.handler';
import { EmployeeResignationHandler } from '../handlers/employee-resignation.handler';
import { LeaveApprovalHandler } from '../handlers/leave-approval.handler';
import { resolveApprovers, resolveToLoginNames, evaluateCondition } from './workflow-util';

@Injectable()
export class WorkflowEngineService {
  private readonly logger = new Logger(WorkflowEngineService.name);
  private notificationService: NotificationService | null = null;
  private readonly NOTIFY = {
    TASK_ASSIGN: 'task_assign',
    TASK_APPROVED: 'task_approved',
    TASK_REJECTED: 'task_rejected',
    TASK_ROLLBACK: 'task_rollback',
    PROCESS_COMPLETED: 'process_completed',
  };

  private readonly handlerMap: Record<string, { handle: (tx: any, businessId: string, instance: any, variables: any) => Promise<void> } | undefined>;

  constructor(
    private prisma: PrismaService,
    @Optional() notificationService?: NotificationService,
    @Optional() private onboardingHandler?: EmployeeOnboardingHandler,
    @Optional() private projectHandler?: ProjectApprovalHandler,
    @Optional() private projectCompletionHandler?: ProjectCompletionHandler,
    @Optional() private expenseHandler?: ExpenseSyncHandler,
    @Optional() private resignationHandler?: EmployeeResignationHandler,
    @Optional() private leaveHandler?: LeaveApprovalHandler,
  ) {
    this.notificationService = notificationService || null;

    this.handlerMap = {
      'employee-onboarding': this.onboardingHandler,
      'employee_onboarding': this.onboardingHandler,
      'person_onboard': this.onboardingHandler,
      'personnel_onboard': this.onboardingHandler,
      'personnel_onboarding': this.onboardingHandler,
      'project-approval': this.projectHandler,
      'project_approval': this.projectHandler,
      'project_completion': this.projectCompletionHandler,
      'expense_reimbursement': this.expenseHandler,
      'expense_reimburse': this.expenseHandler,
      'flight_booking': this.expenseHandler,
      'travel_request': this.expenseHandler,
      'employee-resignation': this.resignationHandler,
      'employee_resignation': this.resignationHandler,
      'personnel_resignation': this.resignationHandler,
      'leave-approval': this.leaveHandler,
      'leave_approval': this.leaveHandler,
      'leave_request': this.leaveHandler,
    };
  }

  private async notify(opts: {
    userIds: string[];
    title: string;
    content?: string;
    type?: string;
    priority?: string;
    actionUrl?: string;
    relatedId?: string;
  }) {
    if (!this.notificationService || !opts.userIds.length) return;
    try {
      await this.notificationService.batchCreateNotifications(opts.userIds, {
        title: opts.title,
        content: opts.content,
        type: opts.type || 'workflow',
        priority: opts.priority,
        actionUrl: opts.actionUrl,
        relatedId: opts.relatedId,
      });
    } catch (e) {
      this.logger.error(`Failed to send notification: ${e.message}`);
    }
  }

  async saveDraft(definitionId: bigint, businessId: string, starter: string, variables?: any) {
    const id = BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000));
    const def = await this.prisma.flowDefinition.findUnique({ where: { id: definitionId } });
    if (!def) throw new BadRequestException('流程定义不存在');

    const nodes = await this.prisma.flowNode.findMany({ where: { definitionId } });
    const startNode = nodes.find(n => n.nodeType === 0);
    const skip = await this.prisma.flowSkip.findFirst({
      where: { definitionId, nowNodeCode: startNode?.nodeCode ?? '' }
    });
    const nextNode = nodes.find(n => n.nodeCode === skip?.nextNodeCode);

    return this.prisma.flowInstance.create({
      data: {
        id,
        definitionId,
        businessId,
        nodeType: nextNode?.nodeType ?? 1,
        nodeCode: nextNode?.nodeCode ?? '',
        flowStatus: 'draft',
        createBy: starter,
        ext: variables ? JSON.stringify(variables) : null,
        createTime: new Date(),
        updateTime: new Date(),
      }
    });
  }

  async submitDraft(instanceId: bigint, starter: string) {
    const instance = await this.prisma.flowInstance.findUnique({ where: { id: instanceId } });
    if (!instance || instance.flowStatus !== 'draft') {
      throw new BadRequestException('草稿不存在或状态异常');
    }

    const nodes = await this.prisma.flowNode.findMany({ where: { definitionId: instance.definitionId } });
    const startNode = nodes.find(n => n.nodeType === 0);
    const skip = await this.prisma.flowSkip.findFirst({
      where: { definitionId: instance.definitionId, nowNodeCode: startNode?.nodeCode ?? 'START' }
    });
    const nextNode = nodes.find(n => n.nodeCode === skip?.nextNodeCode);

    if (!nextNode) throw new BadRequestException('流程配置异常：未找到首个执行节点');

    return this.prisma.$transaction(async (tx) => {
      await tx.flowInstance.update({
        where: { id: instanceId },
        data: { flowStatus: 'running', updateTime: new Date() }
      });

      const dummyApplyTask = { id: BigInt(0), definitionId: instance.definitionId, instanceId, nodeCode: startNode?.nodeCode ?? 'START', nodeName: '发起申请', nodeType: 0 };
      await this.archiveTask(tx, dummyApplyTask, nextNode, starter, 'pass', '提交申请', {}, 1);

      await this.moveToNextNode(tx, instanceId, nextNode, starter, {}, '流向首个审批环节');
      return { success: true };
    });
  }

  async startInstance(definitionId: bigint, businessId: string, starter: string, variables: any = {}) {
    const def = await this.prisma.flowDefinition.findUnique({ where: { id: definitionId } });
    if (!def) throw new BadRequestException('流程定义不存在');

    const nodes = await this.prisma.flowNode.findMany({ where: { definitionId: def.id } });
    const startNode = nodes.find(n => n.nodeType === 0);
    const skip = await this.prisma.flowSkip.findFirst({ where: { definitionId: def.id, nowNodeCode: startNode?.nodeCode ?? 'START' } });
    const nextNode = nodes.find(n => n.nodeCode === skip?.nextNodeCode);

    this.logger.log(`startInstance: definitionId=${definitionId}, nodesCount=${nodes.length}, startNode=${startNode?.nodeCode}, skipTo=${skip?.nextNodeCode}, foundNextNode=${!!nextNode}`);

    if (!nextNode) throw new BadRequestException(`流程配置异常：未找到首个执行节点 (${skip?.nextNodeCode || '无流向'})`);

    return this.prisma.$transaction(async (tx) => {
      const instanceId = BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000000));
      await tx.flowInstance.create({
        data: { id: instanceId, definitionId: def.id, businessId, nodeType: nextNode!.nodeType, nodeCode: nextNode!.nodeCode, nodeName: nextNode!.nodeName, flowStatus: 'running', createBy: starter, ext: JSON.stringify(variables), createTime: new Date(), updateTime: new Date() }
      });

      const dummyApplyTask = { id: BigInt(0), definitionId: def.id, instanceId, nodeCode: startNode?.nodeCode ?? 'START', nodeName: '发起申请', nodeType: 0 };
      await this.archiveTask(tx, dummyApplyTask, nextNode, starter, 'pass', '启动流程', {}, 1);

      await this.moveToNextNode(tx, instanceId, nextNode!, starter, variables, '流向首个审批环节');
      return { id: instanceId };
    });
  }

  async completeTask(taskId: bigint, approver: string, variables: any = {}, comment: string = '') {
    const task = await this.prisma.flowTask.findUnique({ where: { id: taskId } });
    if (!task) throw new BadRequestException('任务不存在');

    const nodes = await this.prisma.flowNode.findMany({ where: { definitionId: task.definitionId } });
    const skips = await this.prisma.flowSkip.findMany({ where: { definitionId: task.definitionId, nowNodeCode: task.nodeCode } });

    let nextSkip = skips[0];
    if (skips.length > 1 && variables) {
      const matched = skips.find(s => evaluateCondition(s.skipCondition, variables));
      if (matched) nextSkip = matched;
    }
    if (!nextSkip) throw new BadRequestException('无后续节点');

    const nextNode = nodes.find(n => n.nodeCode === nextSkip.nextNodeCode);

    return this.prisma.$transaction(async (tx) => {
      await tx.flowTask.delete({ where: { id: taskId } });
      await this.archiveTask(tx, task, nextNode, approver, 'pass', comment, variables, 1);
      await tx.flowUser.deleteMany({ where: { associated: taskId } });

      const instance = await tx.flowInstance.findUnique({ where: { id: task.instanceId } });

      if (variables && Object.keys(variables).length > 0) {
        let currentExt: any = {};
        try {
          if (instance) {
            currentExt = typeof instance.ext === 'string' ? JSON.parse(instance.ext) : (instance.ext || {});
          }
        } catch (e) { currentExt = {}; }

        const newExt = { ...currentExt, ...variables };
        if (variables.formData) {
           newExt.formData = { ...(currentExt.formData || {}), ...variables.formData };
        }

        await tx.flowInstance.update({
          where: { id: task.instanceId },
          data: { ext: JSON.stringify(newExt) }
        });
      }

      this.notify({
        userIds: [instance?.createBy || ''].filter(Boolean),
        title: `【审批通过】${instance?.businessId || ''}`,
        content: `您的申请已被「${approver}」审批通过，正在流转至下一环节。`,
        type: this.NOTIFY.TASK_APPROVED,
        priority: 'normal',
        actionUrl: `/approvals/detail/${task.instanceId}`,
        relatedId: task.instanceId.toString(),
      });

      return this.moveToNextNode(tx, task.instanceId, nextNode!, approver, variables);
    });
  }

  private async moveToNextNode(tx: any, instanceId: bigint, node: any, operator: string, variables: any = {}, comment: string = '') {
    if (node.nodeType === 2) {
      await tx.flowInstance.update({
        where: { id: instanceId },
        data: { flowStatus: 'finished', nodeType: 2, nodeCode: node.nodeCode, nodeName: node.nodeName, updateTime: new Date() }
      });
      const instance = await tx.flowInstance.findUnique({ where: { id: instanceId } });
      await this.handleWorkflowCompletion(tx, instance.definitionId, instance.businessId);
      return { finished: true };
    }

    if (node.nodeType === 1 && node.handlerType === 'service') {
      const skips = await tx.flowSkip.findMany({ where: { definitionId: node.definitionId, nowNodeCode: node.nodeCode } });
      let nextSkip = skips.find(s => s.skipType === 'pass') || skips[0];
      const nextNode = nextSkip ? await tx.flowNode.findFirst({ where: { definitionId: node.definitionId, nodeCode: nextSkip.nextNodeCode } }) : null;

      const dummyTask = { id: BigInt(0), definitionId: node.definitionId, instanceId, nodeCode: node.nodeCode, nodeName: node.nodeName, nodeType: node.nodeType };
      await this.archiveTask(tx, dummyTask, nextNode, operator, 'service', `服务节点: ${node.nodeName}`, variables, 1);

      this.logger.log(`服务节点 [${node.nodeName}] 开始执行`);
      await this.executeServiceNode(tx, node, instanceId, operator, variables, comment);
      this.logger.log(`服务节点 [${node.nodeName}] 执行完成`);

      if (nextNode) {
        return this.moveToNextNode(tx, instanceId, nextNode, operator, variables, comment);
      }
      return { finished: true };
    }

    const instance = await tx.flowInstance.findUnique({ where: { id: instanceId } });
    const approvers = node.permissionFlag ? await resolveApprovers(this.prisma, node.permissionFlag, instance?.createBy, variables) : [];

    if (approvers.length === 0) {
      this.logger.warn(`节点 [${node.nodeName}] 无有效审批人，执行自动跳过`);
      const dummyTask = { id: BigInt(0), definitionId: node.definitionId, instanceId, nodeCode: node.nodeCode, nodeName: node.nodeName, nodeType: node.nodeType };

      const skips = await tx.flowSkip.findMany({ where: { definitionId: node.definitionId, nowNodeCode: node.nodeCode } });
      let nextSkip = skips[0];
      if (skips.length > 1) {
        const matched = skips.find(s => evaluateCondition(s.skipCondition, variables));
        if (matched) nextSkip = matched;
      }
      const nextNode = await tx.flowNode.findFirst({ where: { definitionId: node.definitionId, nodeCode: nextSkip?.nextNodeCode } });

      await this.archiveTask(tx, dummyTask, nextNode, 'SYSTEM', 'auto_skip', '无审批人，系统自动跳过', variables, 1);

      if (nextNode) {
        return this.moveToNextNode(tx, instanceId, nextNode, operator, variables, comment);
      }
    }

    const newTaskId = BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000000));
    await tx.flowTask.create({
      data: { id: newTaskId, definitionId: node.definitionId, instanceId, nodeCode: node.nodeCode, nodeName: node.nodeName, nodeType: node.nodeType, flowStatus: 'todo', createTime: new Date(), updateTime: new Date() }
    });

    for (const app of approvers) {
      await tx.flowUser.create({
        data: { id: BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 10000000)), type: '1', processedBy: app.loginName, associated: newTaskId }
      });
    }

    await tx.flowInstance.update({
      where: { id: instanceId },
      data: { nodeType: node.nodeType, nodeCode: node.nodeCode, nodeName: node.nodeName, updateTime: new Date() }
    });

    const updatedInstance = await tx.flowInstance.findUnique({ where: { id: instanceId } });
    const def = await tx.flowDefinition.findUnique({ where: { id: node.definitionId } });

    this.notify({
      userIds: approvers.map(a => a.loginName),
      title: `【待审批】${def?.flowName || '流程'}`,
      content: `您有一个新的审批任务，请尽快处理。业务编号: ${updatedInstance?.businessId || instanceId}`,
      type: this.NOTIFY.TASK_ASSIGN,
      priority: 'normal',
      actionUrl: `/approvals/handle/${newTaskId}`,
      relatedId: instanceId.toString(),
    });

    return { finished: false, nextNode: node.nodeName };
  }

  private async executeServiceNode(tx: any, node: any, instanceId: bigint, operator: string, variables: any = {}, comment: string = '') {
    if (!tx) {
      this.logger.error('executeServiceNode: tx is undefined');
      return;
    }
    const handlerType = node.handlerType;
    const handlerPath = node.handlerPath;

    this.logger.log(`执行服务节点: ${node.nodeName}, handlerType=${handlerType}, handlerPath=${handlerPath}`);

    if (handlerType === 'service' && handlerPath) {
      const handler = this.handlerMap[handlerPath];
      if (handler) {
        const instance = await tx.flowInstance.findUnique({ where: { id: instanceId } });
        await handler.handle(tx, instance?.businessId, instance, variables);
      } else {
        this.logger.warn(`未知服务处理器: ${handlerPath}`);
      }
    }
  }

  async rejectTask(taskId: bigint, approver: string, comment: string = '') {
    const task = await this.prisma.flowTask.findUnique({ where: { id: taskId } });
    if (!task) {
      this.logger.error(`驳回失败: 任务 [${taskId}] 不存在`);
      throw new BadRequestException('任务不存在');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.flowTask.delete({ where: { id: taskId } });
      await this.archiveTask(tx, task, null, approver, 'reject', comment, null, 1);
      await tx.flowUser.deleteMany({ where: { associated: taskId } });

      await this.cleanUpInstanceActiveTasks(tx, task.instanceId);

      await tx.flowInstance.update({
        where: { id: task.instanceId },
        data: { flowStatus: 'rejected', updateTime: new Date() }
      });

      const instance = await tx.flowInstance.findUnique({ where: { id: task.instanceId } });

      this.notify({
        userIds: [instance?.createBy || ''].filter(Boolean),
        title: `【审批驳回】${instance?.businessId || ''}`,
        content: `您的申请已被「${approver}」驳回。理由: ${comment || '无'}`,
        type: this.NOTIFY.TASK_REJECTED,
        priority: 'high',
        actionUrl: `/approvals/detail/${task.instanceId}`,
        relatedId: task.instanceId.toString(),
      });

      return { success: true, finished: true };
    }, { timeout: 10000 });
  }

  async rollbackTask(taskId: bigint, approver: string, comment: string = '', targetNodeCode?: string) {
    const task = await this.prisma.flowTask.findUnique({ where: { id: taskId } });
    if (!task) {
      this.logger.error(`退回失败: 任务 [${taskId}] 不存在`);
      throw new BadRequestException('任务不存在');
    }

    const nodes = await this.prisma.flowNode.findMany({ where: { definitionId: task.definitionId } });
    let rollbackNode: any;

    if (targetNodeCode && targetNodeCode.trim().length > 0) {
      rollbackNode = nodes.find(n => n.nodeCode === targetNodeCode);
      if (!rollbackNode) {
        throw new BadRequestException(`退回目标节点 [${targetNodeCode}] 不存在`);
      }
    } else {
      const lastHis = await this.prisma.flowHisTask.findFirst({
        where: { instanceId: task.instanceId, skipType: 'pass' },
        orderBy: { createTime: 'desc' },
      });
      if (lastHis?.nodeCode) rollbackNode = nodes.find(n => n.nodeCode === lastHis.nodeCode);
    }

    if (!rollbackNode) {
      const startNode = nodes.find(n => n.nodeType === 0);
      const skip = await this.prisma.flowSkip.findFirst({ where: { definitionId: task.definitionId, nowNodeCode: startNode?.nodeCode ?? 'START' } });
      rollbackNode = nodes.find(n => n.nodeCode === skip?.nextNodeCode);
    }

    if (!rollbackNode) {
      this.logger.error(`退回失败: 无法确定回退节点 (Instance: ${task.instanceId})`);
      throw new BadRequestException('退回路径计算失败：未能自动计算出可回退的目标');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.flowTask.delete({ where: { id: taskId } });
      await this.archiveTask(tx, task, rollbackNode, approver, 'rollback', comment, null, 1);
      await tx.flowUser.deleteMany({ where: { associated: taskId } });

      await this.cleanUpInstanceActiveTasks(tx, task.instanceId);

      const instance = await tx.flowInstance.findUnique({ where: { id: task.instanceId } });

      this.notify({
        userIds: [instance?.createBy || ''].filter(Boolean),
        title: `【审批退回】${instance?.businessId || ''}`,
        content: `您的申请已被「${approver}」退回至「${rollbackNode.nodeName}」环节，请重新处理。理由: ${comment || '无'}`,
        type: this.NOTIFY.TASK_ROLLBACK,
        priority: 'high',
        actionUrl: `/approvals/detail/${task.instanceId}`,
        relatedId: task.instanceId.toString(),
      });

      return this.moveToNextNode(tx, task.instanceId, rollbackNode, approver, {}, `[退回] ${comment}`);
    }, { timeout: 10000 });
  }

  async transferTask(taskId: bigint, currentUserId: string, targetUserId: string, comment: string = '') {
    const task = await this.prisma.flowTask.findUnique({ where: { id: taskId } });
    if (!task) throw new BadRequestException('任务不存在');

    const currentUser = await this.prisma.flowUser.findFirst({
      where: { associated: taskId, processedBy: currentUserId, type: '1' }
    });
    if (!currentUser) throw new BadRequestException('您不是当前任务的处理人，无法转办');

    const resolvedNames = await resolveToLoginNames(this.prisma, [targetUserId]);
    const targetLoginName = resolvedNames[0];

    return this.prisma.$transaction(async (tx) => {
      await this.archiveTask(tx, task, null, currentUserId, 'transfer', `转办给 ${targetLoginName}: ${comment}`, null, 2);
      await tx.flowUser.updateMany({
        where: { associated: taskId, processedBy: currentUserId, type: '1' },
        data: { processedBy: targetLoginName }
      });
      return { success: true };
    });
  }

  async addSigner(instanceId: bigint, userIds: string[], creator: string) {
    const currentTask = await this.prisma.flowTask.findFirst({
      where: { instanceId, flowStatus: 'todo' },
      orderBy: { createTime: 'desc' }
    });
    if (!currentTask) throw new BadRequestException('当前无待办任务，无法加签');

    const targetLoginNames = await resolveToLoginNames(this.prisma, userIds);

    return this.prisma.$transaction(async (tx) => {
      await this.archiveTask(tx, currentTask, null, creator, 'add_signer', `加签给: ${targetLoginNames.join(', ')}`, null, 6);

      for (const loginName of targetLoginNames) {
        const exists = await tx.flowUser.findFirst({
          where: { associated: currentTask.id, processedBy: loginName, type: '1' }
        });
        if (exists) continue;

        await tx.flowUser.create({
          data: {
            id: BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 10000000)),
            type: '1',
            processedBy: loginName,
            associated: currentTask.id,
            createBy: creator
          }
        });
      }
      return { success: true };
    });
  }

  async copyTo(instanceId: bigint, userIds: string[], creator: string) {
    const instance = await this.prisma.flowInstance.findUnique({ where: { id: instanceId } });
    if (!instance) return { success: false, message: '流程实例不存在' };

    const currentTask = await this.prisma.flowTask.findFirst({
      where: { instanceId, flowStatus: 'todo' },
      orderBy: { createTime: 'desc' }
    });

    const targetLoginNames = await resolveToLoginNames(this.prisma, userIds);

    return this.prisma.$transaction(async (tx) => {
      const associatedId = currentTask?.id ?? BigInt(0);

      for (const loginName of targetLoginNames) {
        await tx.flowUser.create({
          data: {
            id: BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 10000)),
            type: '2',
            processedBy: loginName,
            associated: associatedId,
            createBy: creator
          }
        });
      }

      const dummyTask = currentTask
        ? currentTask
        : { id: BigInt(0), definitionId: instance.definitionId, instanceId, nodeCode: instance.nodeCode, nodeName: instance.nodeName, nodeType: instance.nodeType };
      await this.archiveTask(tx, dummyTask, null, creator, 'cc', `抄送给: ${targetLoginNames.join(', ')}`, null, 1);

      return { success: true };
    });
  }

  async predictNextSteps(instanceId: bigint, currentVariables: any = {}) {
    const instance = await this.prisma.flowInstance.findUnique({ where: { id: instanceId } });
    if (!instance) return [];

    return this.predictFromNode(instance.definitionId, instance.nodeCode, currentVariables);
  }

  async getApprovableHistory(instanceId: bigint) {
    const history = await this.prisma.flowHisTask.findMany({
      where: { instanceId, skipType: 'pass' },
      orderBy: { createTime: 'asc' },
    });
    const result: any[] = [];
    const codes = new Set<string>();
    for (let i = history.length - 1; i >= 0; i--) {
      const h = history[i];
      if (h.nodeCode && !codes.has(h.nodeCode)) {
        result.push({ nodeCode: h.nodeCode, nodeName: h.nodeName, approver: h.approver, time: h.createTime });
        codes.add(h.nodeCode);
      }
    }
    return result.reverse();
  }

  async cancelInstance(instanceId: bigint, operator: string) {
    const instance = await this.prisma.flowInstance.findUnique({ where: { id: instanceId } });
    if (!instance || instance.flowStatus === 'finished') throw new BadRequestException('无法撤回');

    return this.prisma.$transaction(async (tx) => {
      const tasks = await tx.flowTask.findMany({ where: { instanceId }, select: { id: true } });
      await tx.flowUser.deleteMany({ where: { associated: { in: tasks.map(t => t.id) } } });
      await tx.flowTask.deleteMany({ where: { instanceId } });
      await tx.flowInstance.update({
        where: { id: instanceId },
        data: { flowStatus: 'cancelled', updateTime: new Date(), updateBy: operator }
      });
      return { success: true };
    });
  }

  private async handleWorkflowCompletion(tx: any, definitionId: bigint, businessId: string) {
    if (!tx) {
      this.logger.error('handleWorkflowCompletion: tx is undefined');
      return;
    }
    try {
      const safeBusinessId = businessId || '';
      this.logger.log(`handleWorkflowCompletion called: definitionId=${definitionId}, businessId=${safeBusinessId}`);
      const def = await tx.flowDefinition.findUnique({ where: { id: definitionId } });
      const flowCode = def?.flowCode || '';

      if (!safeBusinessId) {
        this.logger.warn('handleWorkflowCompletion: businessId is empty, skipping');
        return;
      }

      const instance = await tx.flowInstance.findFirst({ where: { businessId: safeBusinessId } });

      this.notify({
        userIds: [instance?.createBy || ''].filter(Boolean),
        title: `【流程完成】${def?.flowName || '流程'}`,
        content: `您的申请「${safeBusinessId}」已全部审批通过，流程已结束。`,
        type: this.NOTIFY.PROCESS_COMPLETED,
        priority: 'normal',
        actionUrl: `/approvals/detail/${instance?.id}`,
        relatedId: instance?.id.toString(),
      });

      const handler = this.handlerMap[flowCode];
      if (handler) {
        this.logger.log(`handleWorkflowCompletion: 调用处理器 ${flowCode}`);
        await handler.handle(tx, safeBusinessId, instance, {});
      } else {
        this.logger.log(`handleWorkflowCompletion: flowCode=${flowCode} 不匹配任何处理器`);
      }
    } catch (err) {
      this.logger.error(`业务联动失败: ${err.message}`);
    }
  }

  private async archiveTask(tx: any, task: any, targetNode: any, approver: string, skipType: string, comment: string, variables?: any, cooperateType: number = 1) {
    const hisId = BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000000));
    await tx.flowHisTask.create({
      data: {
        id: hisId,
        definitionId: task.definitionId,
        instanceId: task.instanceId,
        taskId: task.id,
        nodeCode: task.nodeCode,
        nodeName: task.nodeName,
        nodeType: task.nodeType,
        targetNodeCode: targetNode?.nodeCode ?? null,
        targetNodeName: targetNode?.nodeName ?? null,
        approver,
        cooperateType,
        skipType,
        flowStatus: skipType === 'pass' ? 'finished' : (skipType === 'reject' ? 'rejected' : 'running'),
        message: comment,
        variable: variables ? JSON.stringify(variables) : null,
        createTime: new Date(),
        updateTime: new Date(),
      }
    });
  }

  private async cleanUpInstanceActiveTasks(tx: any, instanceId: bigint) {
    const remainingTasks = await tx.flowTask.findMany({
      where: { instanceId, flowStatus: 'todo' }
    });
    for (const rt of remainingTasks) {
      await tx.flowUser.deleteMany({ where: { associated: rt.id } });
      await tx.flowTask.delete({ where: { id: rt.id } });
    }
  }

  private async predictFromNode(definitionId: bigint, startNodeCode: string, variables: any, depth: number = 0): Promise<any[]> {
    if (depth > 10) return [];

    const nodes = await this.prisma.flowNode.findMany({ where: { definitionId } });
    const skips = await this.prisma.flowSkip.findMany({ where: { definitionId, nowNodeCode: startNodeCode } });

    if (skips.length === 0) return [];

    const path: any[] = [];
    let nextSkip = skips[0];

    if (skips.length > 1) {
      const matched = skips.find(s => evaluateCondition(s.skipCondition, variables));
      if (matched) nextSkip = matched;
      else {
        return [{
          nodeCode: 'GATEWAY',
          nodeName: '等待决策',
          isPrediction: true,
          choices: skips.map(s => s.skipName)
        }];
      }
    }

    const nextNode = nodes.find(n => n.nodeCode === nextSkip.nextNodeCode);
    if (!nextNode) return [];

    const approvers = nextNode.permissionFlag ? await resolveApprovers(this.prisma, nextNode.permissionFlag, undefined, variables) : [];

    path.push({
      nodeCode: nextNode.nodeCode,
      nodeName: nextNode.nodeName,
      nodeType: nextNode.nodeType,
      permissionFlag: nextNode.permissionFlag,
      approvers: approvers.map(u => ({ userId: u.userId.toString(), userName: u.userName, loginName: u.loginName })),
      isPrediction: true
    });

    if (nextNode.nodeType !== 2) {
      const remaining = await this.predictFromNode(definitionId, nextNode.nodeCode, variables, depth + 1);
      path.push(...remaining);
    }

    return path;
  }
}
