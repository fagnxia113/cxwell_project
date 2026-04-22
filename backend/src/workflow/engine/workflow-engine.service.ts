import { Injectable, BadRequestException, Logger, Inject, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { pinyin } from 'pinyin-pro';
import * as bcrypt from 'bcrypt';
import { NotificationService } from '../../modules/notification/notification.service';

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

  constructor(
    private prisma: PrismaService,
    @Optional() notificationService?: NotificationService,
  ) {
    this.notificationService = notificationService || null;
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

  /**
   * 保存申请草稿
   */
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

  /**
   * 提交草稿
   */
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
      
      // 记录申请人的“提交”动作到历史轨迹，作为后续驳回的回溯点
      const dummyApplyTask = { id: BigInt(0), definitionId: instance.definitionId, instanceId, nodeCode: startNode?.nodeCode ?? 'START', nodeName: '发起申请', nodeType: 0 };
      await this.archiveTask(tx, dummyApplyTask, nextNode, starter, 'pass', '提交申请', {}, 1);

      await this.moveToNextNode(tx, instanceId, nextNode, starter, {}, '流向首个审批环节');
      return { success: true };
    });
  }

  /**
   * 启动流程实例
   */
  async startInstance(definitionId: bigint, businessId: string, starter: string, variables: any = {}) {
    const def = await this.prisma.flowDefinition.findUnique({ where: { id: definitionId } });
    if (!def) throw new BadRequestException('流程定义不存在');

    const nodes = await this.prisma.flowNode.findMany({ where: { definitionId: def.id } });
    const startNode = nodes.find(n => n.nodeType === 0);
    const skip = await this.prisma.flowSkip.findFirst({ where: { definitionId: def.id, nowNodeCode: startNode?.nodeCode ?? 'START' } });
    const nextNode = nodes.find(n => n.nodeCode === skip?.nextNodeCode);

    if (!nextNode) throw new BadRequestException('流程配置异常：未找到首个执行节点');

    return this.prisma.$transaction(async (tx) => {
      const instanceId = BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000000));
      await tx.flowInstance.create({
        data: { id: instanceId, definitionId: def.id, businessId, nodeType: nextNode!.nodeType, nodeCode: nextNode!.nodeCode, nodeName: nextNode!.nodeName, flowStatus: 'running', createBy: starter, ext: JSON.stringify(variables), createTime: new Date(), updateTime: new Date() }
      });

      // 记录申请人的“启动”动作
      const dummyApplyTask = { id: BigInt(0), definitionId: def.id, instanceId, nodeCode: startNode?.nodeCode ?? 'START', nodeName: '发起申请', nodeType: 0 };
      await this.archiveTask(tx, dummyApplyTask, nextNode, starter, 'pass', '启动流程', {}, 1);

      await this.moveToNextNode(tx, instanceId, nextNode!, starter, variables, '流向首个审批环节');
      return { id: instanceId };
    });
  }

  /**
   * 审批通过
   */
  async completeTask(taskId: bigint, approver: string, variables: any = {}, comment: string = '') {
    const task = await this.prisma.flowTask.findUnique({ where: { id: taskId } });
    if (!task) throw new BadRequestException('任务不存在');

    const nodes = await this.prisma.flowNode.findMany({ where: { definitionId: task.definitionId } });
    const skips = await this.prisma.flowSkip.findMany({ where: { definitionId: task.definitionId, nowNodeCode: task.nodeCode } });

    let nextSkip = skips[0];
    if (skips.length > 1 && variables) {
      const matched = skips.find(s => this.evaluateCondition(s.skipCondition, variables));
      if (matched) nextSkip = matched;
    }
    if (!nextSkip) throw new BadRequestException('无后续节点');

    const nextNode = nodes.find(n => n.nodeCode === nextSkip.nextNodeCode);

    return this.prisma.$transaction(async (tx) => {
      await tx.flowTask.delete({ where: { id: taskId } });
      await this.archiveTask(tx, task, nextNode, approver, 'pass', comment, variables, 1);
      await tx.flowUser.deleteMany({ where: { associated: taskId } });

      const instance = await tx.flowInstance.findUnique({ where: { id: task.instanceId } });
      
      // 合并变量到实例的 ext 字段 (formData)
      if (variables && Object.keys(variables).length > 0) {
        let currentExt: any = {};
        try {
          currentExt = typeof instance.ext === 'string' ? JSON.parse(instance.ext) : (instance.ext || {});
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

  /**
   * 核心流转调度器 (支持自动跳过和服务节点)
   */
  private async moveToNextNode(tx: any, instanceId: bigint, node: any, operator: string, variables: any = {}, comment: string = '') {
    if (node.nodeType === 2) {
      // 结束节点
      await tx.flowInstance.update({
        where: { id: instanceId },
        data: { flowStatus: 'finished', nodeType: 2, nodeCode: node.nodeCode, nodeName: node.nodeName, updateTime: new Date() }
      });
      const instance = await tx.flowInstance.findUnique({ where: { id: instanceId } });
      await this.handleWorkflowCompletion(tx, instance.definitionId, instance.businessId);
      return { finished: true };
    }

    // 检查是否为服务节点
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

    // 解析审批人
    const approvers = node.permissionFlag ? await this.resolveApprovers(node.permissionFlag) : [];
    
    if (approvers.length === 0) {
      // 无审批人，记录自动跳过并递归
      this.logger.warn(`节点 [${node.nodeName}] 无有效审批人，执行自动跳过`);
      const dummyTask = { id: BigInt(0), definitionId: node.definitionId, instanceId, nodeCode: node.nodeCode, nodeName: node.nodeName, nodeType: node.nodeType };
      
      const skips = await tx.flowSkip.findMany({ where: { definitionId: node.definitionId, nowNodeCode: node.nodeCode } });
      let nextSkip = skips[0];
      if (skips.length > 1) {
        const matched = skips.find(s => this.evaluateCondition(s.skipCondition, variables));
        if (matched) nextSkip = matched;
      }
      const nextNode = await tx.flowNode.findFirst({ where: { definitionId: node.definitionId, nodeCode: nextSkip?.nextNodeCode } });

      await this.archiveTask(tx, dummyTask, nextNode, 'SYSTEM', 'auto_skip', '无审批人，系统自动跳过', variables, 1);
      
      if (nextNode) {
        return this.moveToNextNode(tx, instanceId, nextNode, operator, variables, comment);
      }
    }

    // 创建任务
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

    const instance = await tx.flowInstance.findUnique({ where: { id: instanceId } });
    const def = await tx.flowDefinition.findUnique({ where: { id: node.definitionId } });

    this.notify({
      userIds: approvers.map(a => a.loginName),
      title: `【待审批】${def?.flowName || '流程'}`,
      content: `您有一个新的审批任务，请尽快处理。业务编号: ${instance?.businessId || instanceId}`,
      type: this.NOTIFY.TASK_ASSIGN,
      priority: 'normal',
      actionUrl: `/approvals/handle/${newTaskId}`,
      relatedId: instanceId.toString(),
    });

    return { finished: false, nextNode: node.nodeName };
  }

  /**
   * 执行服务节点
   */
  private async executeServiceNode(tx: any, node: any, instanceId: bigint, operator: string, variables: any = {}, comment: string = '') {
    if (!tx) {
      this.logger.error('executeServiceNode: tx is undefined');
      return;
    }
    const handlerType = node.handlerType;
    const handlerPath = node.handlerPath;
    const instance = await tx.flowInstance.findUnique({ where: { id: instanceId } });
    const businessId = instance?.businessId;

    this.logger.log(`执行服务节点: ${node.nodeName}, handlerType=${handlerType}, handlerPath=${handlerPath}`);

    if (handlerType === 'service' && handlerPath) {
      switch (handlerPath) {
        case 'employee-onboarding':
          await this.createEmployeeFromOnboardingTx(tx, businessId);
          break;
        case 'project-approval':
          await this.createProjectFromApprovalTx(tx, businessId);
          break;
        default:
          this.logger.warn(`未知服务处理器: ${handlerPath}`);
      }
    }
  }

  /**
   * 在事务中创建员工 (由服务节点调用)
   */
  private async createEmployeeFromOnboardingTx(tx: any, businessId: string) {
    if (!businessId) return;

    const instance = await tx.flowInstance.findFirst({ where: { businessId } });
    if (!instance?.ext) return;

    let formData: any = {};
    try {
      const ext = typeof instance.ext === 'string' ? JSON.parse(instance.ext) : instance.ext;
      formData = ext?.formData || ext?.variables || ext;
    } catch { return; }

    const name = formData.employee_name || formData.employeeName || formData.name;
    if (!name) {
      this.logger.warn(`入职流程 [${businessId}] 无法获取员工姓名，跳过创建`);
      return;
    }

    const phone = formData.phone;
    const existingEmployee = await tx.SysEmployee.findFirst({
      where: { name, phone: phone || undefined }
    });
    if (existingEmployee) {
      this.logger.warn(`入职流程：员工 ${name} 已存在，跳过重复创建`);
      return;
    }

    const basePinyin = pinyin(name, { toneType: 'none', type: 'array' }).join('').toLowerCase();
    let username = basePinyin;
    let userCount = 0;
    while (await tx.SysUser.findUnique({ where: { loginName: username } })) {
      userCount++;
      username = `${basePinyin}${userCount}`;
    }

    const lastEmployee = await tx.SysEmployee.findFirst({
      where: { employeeNo: { startsWith: 'Cxwell-' } },
      orderBy: { employeeNo: 'desc' }
    });
    let nextNo = 1;
    if (lastEmployee?.employeeNo) {
      const match = lastEmployee.employeeNo.match(/\d+$/);
      if (match) nextNo = parseInt(match[0]) + 1;
    }
    const employeeNo = `Cxwell-${nextNo.toString().padStart(5, '0')}`;

    const hashedPassword = await bcrypt.hash('mima1234', 10);
    const userId = BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000));
    const deptId = formData.department_id || formData.departmentId || formData.deptId;
    const positionId = formData.position_id || formData.positionId || formData.position;

    const rawGender = formData.gender || '';
    const genderMap: Record<string, string> = { '男': '0', '女': '1', 'male': '0', 'female': '1', '0': '0', '1': '1' };
    const gender = genderMap[String(rawGender).toLowerCase()] || null;

    const rawEducation = formData.education || '';
    const eduMap: Record<string, string> = { '高中': '1', '大专': '2', '本科': '3', '硕士': '4', '博士': '5', '其他': '0' };
    const education = eduMap[rawEducation] || rawEducation || null;

    await tx.SysUser.create({
      data: {
        userId,
        loginName: username,
        userName: name,
        password: hashedPassword,
        status: '0',
        sex: gender || '0',
        deptId: deptId ? BigInt(deptId) : null
      }
    });

    await tx.SysEmployee.create({
      data: {
        name,
        employeeNo,
        userId,
        status: '0',
        phone: phone || 'N/A',
        deptId: deptId ? BigInt(deptId) : null,
        position: positionId || null,
        gender,
        email: formData.email || null,
        education,
        university: formData.university || formData.graduation_school || null,
        hireDate: formData.start_date || formData.startDate ? new Date(formData.start_date || formData.startDate) : new Date()
      }
    });

    const epyRole = await tx.SysRole.findFirst({ where: { roleKey: 'epy' } });
    if (epyRole) {
      await tx.SysUserRole.create({ data: { userId, roleId: epyRole.roleId } });
    }

    this.logger.log(`服务节点执行完成：为 ${name} 创建了账号 ${username} 和工号 ${employeeNo}`);
  }

  /**
   * 在事务中创建项目 (由服务节点调用)
   */
  private async createProjectFromApprovalTx(tx: any, businessId: string) {
    if (!tx) {
      this.logger.error('createProjectFromApprovalTx: tx is undefined');
      return;
    }
    if (!businessId) {
      this.logger.warn('createProjectFromApprovalTx: businessId is empty');
      return;
    }

    const instance = await tx.flowInstance.findFirst({ where: { businessId } });
    if (!instance) {
      this.logger.warn(`createProjectFromApprovalTx: 未找到 businessId=${businessId} 的流程实例`);
      return;
    }
    if (!instance.ext) {
      this.logger.warn(`createProjectFromApprovalTx: 流程实例 ${businessId} 的 ext 字段为空`);
      return;
    }

    let formData: any = {};
    try {
      const ext = typeof instance.ext === 'string' ? JSON.parse(instance.ext) : instance.ext;
      this.logger.log(`createProjectFromApprovalTx: ext parsed = ${JSON.stringify(ext).substring(0, 200)}`);
      formData = ext?.formData || ext?.variables || ext;
      this.logger.log(`createProjectFromApprovalTx: formData = ${JSON.stringify(formData).substring(0, 200)}`);
    } catch (e: any) {
      this.logger.error(`createProjectFromApprovalTx: JSON.parse 失败: ${e.message}`);
      return;
    }

    const projectName = formData.projectName || formData.name || '未命名项目';
    const projectCode = businessId;

    const existing = await tx.Project.findFirst({
      where: { projectCode }
    });
    if (existing) {
      this.logger.warn(`createProjectFromApprovalTx: 项目 ${projectCode} 已存在，跳过重复创建`);
      return;
    }

    await tx.Project.create({
      data: {
        projectName,
        projectCode: businessId,
        projectType: formData.projectType || 'domestic',
        country: formData.country || null,
        address: formData.address || null,
        attachments: formData.attachments || null,
        managerId: formData.managerId ? BigInt(formData.managerId) : null,
        customerId: formData.customerId ? BigInt(formData.customerId) : null,
        status: '1',
        startDate: formData.startDate ? new Date(formData.startDate) : new Date(),
        endDate: formData.endDate ? new Date(formData.endDate) : null,
        budget: formData.budget ? Number(formData.budget) : 0,
        description: formData.description || '',
        buildingArea: formData.buildingArea ? Number(formData.buildingArea) : null,
        itCapacity: formData.itCapacity ? Number(formData.itCapacity) : null,
        cabinetCount: formData.cabinetCount ? Number(formData.cabinetCount) : null,
        cabinetPower: formData.cabinetPower ? Number(formData.cabinetPower) : null,
        powerArchitecture: formData.powerArchitecture || '',
        hvacArchitecture: formData.hvacArchitecture || '',
        fireArchitecture: formData.fireArchitecture || '',
        weakElectricArchitecture: formData.weakElectricArchitecture || '',
        createBy: instance.createBy || 'system',
      }
    });

    this.logger.log(`服务节点执行完成：为 ${projectName} 创建了项目`);
  }

  /**
   * 将传入的 UserID (数字字符串或登录名) 解析为系统中统一使用的 loginName
   * 这是为了解决前端传 ID (如 '3') 而后端逻辑依赖 loginName (如 'admin') 的不匹配问题
   */
  private async resolveToLoginNames(identifiers: string[]): Promise<string[]> {
    if (!identifiers || identifiers.length === 0) return [];
    
    const results: string[] = [];
    for (const id of identifiers) {
      const trimmedId = String(id).trim();
      // 尝试作为 ID 查询
      if (/^\d+$/.test(trimmedId)) {
        const user = await this.prisma.sysUser.findUnique({ where: { userId: BigInt(trimmedId) } });
        if (user) {
          results.push(user.loginName);
          continue;
        }
      }
      // 如果不是纯数字或者是数字但没搜到用户，则保持原样 (当做 loginName 处理)
      results.push(trimmedId);
    }
    return results;
  }

  /**
   * 驳回 (流程结束，标记为已驳回)
   */
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

  /**
   * 退回 (流程回退到指定节点，继续运行)
   */
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

  /**
   * 清理实例中所有其他未完成的任务 (一票否决机制)
   */
  private async cleanUpInstanceActiveTasks(tx: any, instanceId: bigint) {
    const remainingTasks = await tx.flowTask.findMany({
      where: { instanceId, flowStatus: 'todo' }
    });
    for (const rt of remainingTasks) {
      await tx.flowUser.deleteMany({ where: { associated: rt.id } });
      await tx.flowTask.delete({ where: { id: rt.id } });
    }
  }

  /**
   * 转办 (转发)
   */
  async transferTask(taskId: bigint, currentUserId: string, targetUserId: string, comment: string = '') {
    const task = await this.prisma.flowTask.findUnique({ where: { id: taskId } });
    if (!task) throw new BadRequestException('任务不存在');

    const currentUser = await this.prisma.flowUser.findFirst({
      where: { associated: taskId, processedBy: currentUserId, type: '1' }
    });
    if (!currentUser) throw new BadRequestException('您不是当前任务的处理人，无法转办');

    const resolvedNames = await this.resolveToLoginNames([targetUserId]);
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

  /**
   * 加签 (增加审批人)
   */
  async addSigner(instanceId: bigint, userIds: string[], creator: string) {
    const currentTask = await this.prisma.flowTask.findFirst({
      where: { instanceId, flowStatus: 'todo' },
      orderBy: { createTime: 'desc' }
    });
    if (!currentTask) throw new BadRequestException('当前无待办任务，无法加签');

    const targetLoginNames = await this.resolveToLoginNames(userIds);

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

  /**
   * 抄送
   */
  async copyTo(instanceId: bigint, userIds: string[], creator: string) {
    const instance = await this.prisma.flowInstance.findUnique({ where: { id: instanceId } });
    if (!instance) return { success: false, message: '流程实例不存在' };

    const currentTask = await this.prisma.flowTask.findFirst({
      where: { instanceId, flowStatus: 'todo' },
      orderBy: { createTime: 'desc' }
    });

    const targetLoginNames = await this.resolveToLoginNames(userIds);

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

  /**
   * 路径预测 (增强版：支持审批人穿透解析)
   */
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
      this.logger.log(`Flow code: ${flowCode}, is project_approval: ${flowCode === 'project_approval'}`);

      if (!safeBusinessId) {
        this.logger.warn('handleWorkflowCompletion: businessId is empty, skipping');
        return;
      }

      const instance = await tx.flowInstance.findFirst({ where: { businessId: safeBusinessId } });
      this.logger.log(`Instance found: ${instance?.id}, ext length: ${instance?.ext?.length || 0}`);

      this.notify({
        userIds: [instance?.createBy || ''].filter(Boolean),
        title: `【流程完成】${def?.flowName || '流程'}`,
        content: `您的申请「${safeBusinessId}」已全部审批通过，流程已结束。`,
        type: this.NOTIFY.PROCESS_COMPLETED,
        priority: 'normal',
        actionUrl: `/approvals/detail/${instance?.id}`,
        relatedId: instance?.id.toString(),
      });

      if (flowCode === 'project_approval') {
        this.logger.log(`handleWorkflowCompletion: 准备调用 createProjectFromApproval`);
        await this.createProjectFromApproval(tx, safeBusinessId);
      } else if (flowCode === 'employee_onboarding' || flowCode === 'person_onboard' || flowCode === 'personnel_onboard' || flowCode === 'personnel_onboarding') {
        await this.createEmployeeFromOnboarding(tx, safeBusinessId);
      } else if (flowCode === 'expense_reimbursement' || flowCode === 'flight_booking' || flowCode === 'expense_reimburse' || flowCode === 'travel_request') {
        this.logger.log(`handleWorkflowCompletion: 准备调用 syncToProjectExpense (FlowCode: ${flowCode})`);
        await this.syncToProjectExpense(tx, safeBusinessId);
      } else {
        this.logger.log(`handleWorkflowCompletion: flowCode=${flowCode} 不匹配任何处理器`);
      }
    } catch (err) {
      this.logger.error(`业务联动失败: ${err.message}`);
    }
  }

  /**
   * 将流程表单中的费用同步到项目费用
   */
  private async syncToProjectExpense(tx: any, businessId: string) {
    if (!tx || !businessId) return;
    
    try {
      const instance = await tx.flowInstance.findFirst({ where: { businessId } });
      if (!instance || !instance.ext) {
        this.logger.warn(`syncToProjectExpense: 未找到流程实例或 ext 为空 (businessId=${businessId})`);
        return;
      }

      let vars: any = {};
      try {
        vars = typeof instance.ext === 'string' ? JSON.parse(instance.ext) : instance.ext;
      } catch (e) {
        this.logger.error(`syncToProjectExpense: 解析 ext 失败: ${e.message}`);
        return;
      }

      const formData = vars?.formData || vars?.variables || vars || {};
      
      // 处理多条明细 (Subform 逻辑)
      const items = formData.items;
      if (Array.isArray(items) && items.length > 0) {
        this.logger.log(`syncToProjectExpense: 发现明细项 ${items.length} 条，准备批量同步...`);
        for (const item of items) {
          const itemProjectId = item.project_id || item.projectId;
          const itemAmount = Number(item.amount || 0);
          
          if (itemProjectId && itemAmount > 0) {
            await tx.projectExpense.create({
              data: {
                projectId: BigInt(itemProjectId),
                category: String(item.category || 'travel'),
                amount: itemAmount,
                date: item.date ? new Date(item.date) : new Date(),
                notes: String(item.item_reason || formData.reason || `明细同步: ${businessId}`),
                sourceType: 'workflow',
                sourceId: instance.id
              }
            });
          }
        }
        this.logger.log(`[批量同步成功] 流程 [${businessId}] 的 ${items.length} 条明细已同步`);
        return;
      }

      // 回退逻辑: 处理单笔费用 (旧逻辑)
      const projectIdStr = formData.project_id || formData.projectId;
      if (!projectIdStr) {
        this.logger.log(`syncToProjectExpense: 流程 [${businessId}] 未选择项目，无需同步`);
        return;
      }

      // 获取金额 (支持 amount, total_amount, final_amount)
      // 机票预定通常由预定员填写 final_amount，报销单通常由申请人填写 amount
      const amountValue = formData.final_amount || formData.amount || formData.total_amount || 0;
      const amount = Number(amountValue);

      if (isNaN(amount) || amount <= 0) {
        this.logger.warn(`syncToProjectExpense: 流程 [${businessId}] 的金额无效: ${amountValue}`);
        return;
      }

      // 获取分类和事由
      const category = formData.expense_category || formData.category || 'travel'; // 默认为差旅费
      let notes = formData.reason || formData.notes || formData.description || `流程同步: ${instance.nodeName || '已结束'}`;
      
      // 如果有机票照片附件，在备注里记录一下
      if (formData.attachments || formData.ticket_photo) {
        notes += ` (含附件记录)`;
      }

      await tx.projectExpense.create({
        data: {
          projectId: BigInt(projectIdStr),
          category: String(category),
          amount: amount,
          date: formData.date ? new Date(formData.date) : new Date(),
          notes: String(notes),
          sourceType: 'workflow',
          sourceId: instance.id
        }
      });

      this.logger.log(`[同步成功] 已将流程 [${businessId}] 的费用 [${amount}] 同步到项目 ID [${projectIdStr}]`);
    } catch (err) {
      this.logger.error(`syncToProjectExpense 失败: ${err.message}`);
    }
  }

  private async createProjectFromApproval(tx: any, businessId: string) {
    this.logger.log(`createProjectFromApproval called: businessId=${businessId}`);
    const instance = await tx.flowInstance.findFirst({ where: { businessId } });
    if (!instance) {
      this.logger.warn(`createProjectFromApproval: 未找到 businessId=${businessId} 的流程实例`);
      return;
    }
    if (!instance.ext) {
      this.logger.warn(`createProjectFromApproval: 流程实例 ${businessId} 的 ext 字段为空`);
      return;
    }
    let vars: any = {};
    try {
      vars = JSON.parse(instance.ext);
      this.logger.log(`createProjectFromApproval: ext parsed, keys=${Object.keys(vars).join(',')}`);
    } catch (e: any) {
      this.logger.warn(`createProjectFromApproval: JSON.parse 失败: ${e.message}, ext=${instance.ext?.substring(0, 100)}`);
      return;
    }
    const formData = vars?.formData || vars?.variables || vars || {};
    this.logger.log(`createProjectFromApproval: formData.projectName=${formData.projectName}, formData.name=${formData.name}, keys=${Object.keys(formData).join(',')}`);

    const projectName = formData.projectName || formData.name || '未命名项目';
    const projectCode = businessId;

    const existing = await tx.Project.findFirst({ where: { projectCode } });
    if (existing) {
      this.logger.warn(`createProjectFromApproval: 项目 ${projectCode} 已存在, existingProjectId=${existing.projectId}, projectName=${existing.projectName}`);
      await tx.Project.update({
        where: { projectId: existing.projectId },
        data: { status: '1', updateTime: new Date() }
      });
      return;
    }
    const projectId = BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 10000));

    await tx.Project.create({
      data: {
        projectId,
        projectName: formData.projectName || '未命名项目',
        projectCode,
        projectType: formData.projectType || 'domestic',
        status: '1',
        startDate: formData.startDate ? new Date(formData.startDate) : new Date(),
        endDate: formData.endDate ? new Date(formData.endDate) : null,
        managerId: formData.managerId ? BigInt(formData.managerId) : null,
        customerId: formData.customerId ? BigInt(formData.customerId) : null,
        budget: formData.budget ? Number(formData.budget) : 0,
        description: formData.description || '',
        buildingArea: formData.buildingArea ? Number(formData.buildingArea) : null,
        itCapacity: formData.itCapacity ? Number(formData.itCapacity) : null,
        cabinetCount: formData.cabinetCount ? Number(formData.cabinetCount) : null,
        cabinetPower: formData.cabinetPower ? Number(formData.cabinetPower) : null,
        powerArchitecture: formData.powerArchitecture || '',
        hvacArchitecture: formData.hvacArchitecture || '',
        fireArchitecture: formData.fireArchitecture || '',
        weakElectricArchitecture: formData.weakElectricArchitecture || '',
        createBy: instance.createBy || 'system',
        createTime: new Date(),
        updateTime: new Date(),
      }
    });

    await tx.flowInstance.update({
      where: { id: instance.id },
      data: { businessId: projectId.toString() }
    });

    this.logger.log(`项目立项审批通过，已创建项目台账: ${projectCode}`);
  }

  private async createEmployeeFromOnboarding(tx: any, businessId: string) {
    const instance = await tx.flowInstance.findFirst({ where: { businessId } });
    if (!instance?.ext) return;
    const vars = JSON.parse(instance.ext);
    const formData = vars?.formData || vars;
    const name = formData.employeeName || vars.employeeName || vars.name;
    if (!name) {
      this.logger.warn(`入职流程 [${businessId}] 无法获取员工姓名，跳过创建: ${JSON.stringify(vars)}`);
      return;
    }

    const phone = formData.phone || vars.phone;
    const existingEmployee = await tx.SysEmployee.findFirst({
      where: { name, phone: phone || undefined }
    });
    if (existingEmployee) {
      this.logger.warn(`入职流程：员工 ${name} 已存在，跳过重复创建`);
      return;
    }

    const basePinyin = pinyin(name, { toneType: 'none', type: 'array' }).join('').toLowerCase();
    let username = basePinyin;
    let userCount = 0;
    while (await tx.SysUser.findUnique({ where: { loginName: username } })) {
      userCount++;
      username = `${basePinyin}${userCount}`;
    }

    const lastEmployee = await tx.SysEmployee.findFirst({
      where: { employeeNo: { startsWith: 'Cxwell-' } },
      orderBy: { employeeNo: 'desc' }
    });

    let nextNo = 1;
    if (lastEmployee && lastEmployee.employeeNo) {
      const match = lastEmployee.employeeNo.match(/\d+$/);
      if (match) {
        nextNo = parseInt(match[0]) + 1;
      }
    }
    const employeeNo = `Cxwell-${nextNo.toString().padStart(5, '0')}`;

    const hashedPassword = await bcrypt.hash('mima1234', 10);
    const userId = BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000));
    const deptId = formData.departmentId || vars.departmentId;
    const position = formData.position || vars.position;

    await tx.SysUser.create({
      data: {
        userId,
        loginName: username,
        userName: name,
        password: hashedPassword,
        status: '0',
        deptId: deptId ? BigInt(deptId) : null
      }
    });

    await tx.SysEmployee.create({
      data: {
        name,
        employeeNo,
        userId,
        status: '0',
        phone: phone || 'N/A',
        deptId: deptId ? BigInt(deptId) : null,
        position: position || null,
        gender: formData.gender || vars.gender || null,
        email: formData.email || vars.email || null,
        education: formData.education || vars.education || null,
        university: formData.university || vars.university || null,
        hireDate: formData.startDate ? new Date(formData.startDate) : new Date()
      }
    });

    const epyRole = await tx.SysRole.findFirst({ where: { roleKey: 'epy' } });
    if (epyRole) {
      await tx.SysUserRole.create({
        data: {
          userId,
          roleId: epyRole.roleId,
        }
      });
    }

    await tx.flowInstance.update({
      where: { id: instance.id },
      data: { businessId: `EMP-${employeeNo}` }
    });

    this.logger.log(`入职流程完成：为 ${name} 创建了账号 ${username} 和工号 ${employeeNo}，已分配员工角色`);
  }

  private async archiveTask(tx: any, task: any, targetNode: any, approver: string, skipType: string, comment: string, variables?: any, cooperateType: number = 1) {
    // 归档到历史任务表
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

  /**
   * 递归预测逻辑
   */
  private async predictFromNode(definitionId: bigint, startNodeCode: string, variables: any, depth: number = 0): Promise<any[]> {
    if (depth > 10) return [];

    const nodes = await this.prisma.flowNode.findMany({ where: { definitionId } });
    const skips = await this.prisma.flowSkip.findMany({ where: { definitionId, nowNodeCode: startNodeCode } });

    if (skips.length === 0) return [];

    const path: any[] = [];
    let nextSkip = skips[0];

    if (skips.length > 1) {
      const matched = skips.find(s => this.evaluateCondition(s.skipCondition, variables));
      if (matched) nextSkip = matched;
      else {
        // 分支决策
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

    // 解析当前预测节点的处理人
    const approvers = nextNode.permissionFlag ? await this.resolveApprovers(nextNode.permissionFlag) : [];

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

  /**
   * 解析审批人标识
   * 支持: role:xxx, dept:xxx, userId1,userId2
   */
  private async resolveApprovers(flag: string): Promise<any[]> {
    if (!flag) return [];
    const parts = flag.split(',').filter(Boolean).map(p => p.trim());
    const users: any[] = [];

    for (const part of parts) {
      if (part.startsWith('role:')) {
        const roleKey = part.replace('role:', '');
        const matchingRoles = await this.prisma.sysRole.findMany({
          where: { roleKey, delFlag: '0' },
          select: { roleId: true }
        });
        const roleIds = matchingRoles.map(r => r.roleId);
        if (roleIds.length === 0) continue;
        const roleUsers = await this.prisma.sysUser.findMany({
          where: {
            delFlag: '0',
            status: '0',
            userId: {
              in: (await this.prisma.sysUserRole.findMany({
                where: { roleId: { in: roleIds } },
                select: { userId: true }
              })).map(ur => ur.userId)
            }
          }
        });
        users.push(...roleUsers);
      } else if (part.startsWith('dept:')) {
        const deptId = BigInt(part.replace('dept:', ''));
        const deptUsers = await this.prisma.sysUser.findMany({
          where: { deptId, delFlag: '0', status: '0' }
        });
        users.push(...deptUsers);
      } else {
        // 假设是 loginName 或 userId
        const user = await this.prisma.sysUser.findFirst({
          where: {
            OR: [
              { loginName: part },
              { userId: isNaN(Number(part)) ? undefined : BigInt(part) }
            ],
            delFlag: '0'
          }
        });
        if (user) users.push(user);
      }
    }

    // 去重
    const uniqueMap = new Map();
    users.forEach(u => uniqueMap.set(u.userId.toString(), u));
    return Array.from(uniqueMap.values());
  }

  private evaluateCondition(condition: string | null, variables: Record<string, any>): boolean {
    if (!condition) return false;
    const safePattern = /^[a-zA-Z0-9_\s.><=!&|()'"-]+$/;
    if (!safePattern.test(condition)) {
      this.logger.warn(`条件表达式包含不安全字符，已拒绝执行: ${condition}`);
      return false;
    }
    const blocked = ['require', 'import', 'process', 'global', 'eval', 'Function', 'exec', 'spawn', 'child_process', '__proto__', 'constructor', 'prototype'];
    for (const kw of blocked) {
      if (condition.includes(kw)) {
        this.logger.warn(`条件表达式包含禁止关键字 "${kw}"，已拒绝执行: ${condition}`);
        return false;
      }
    }
    try {
      const keys = Object.keys(variables);
      const values = Object.values(variables);
      return new Function(...keys, `"use strict"; return (${condition});`)(...values);
    } catch (e) {
      return false;
    }
  }
}
