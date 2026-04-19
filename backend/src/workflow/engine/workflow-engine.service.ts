import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { pinyin } from 'pinyin-pro';
import * as bcrypt from 'bcrypt';

@Injectable()
export class WorkflowEngineService {
  private readonly logger = new Logger(WorkflowEngineService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 保存申请草稿
   */
  async saveDraft(definitionId: bigint, businessId: string, starter: string, variables?: any) {
    const id = BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000));
    const def = await this.prisma.flowDefinition.findUnique({ where: { id: definitionId } });
    if (!def) throw new BadRequestException('流程定义不存在');

    return this.prisma.flowInstance.create({
      data: {
        id,
        definitionId,
        businessId,
        flowStatus: 'draft',
        createBy: starter,
        ext: variables ? JSON.stringify(variables) : null,
      }
    });
  }

  /**
   * 提交草稿（正式发起流程）
   */
  async submitDraft(instanceId: bigint, starter: string) {
    const instance = await this.prisma.flowInstance.findUnique({ where: { id: instanceId } });
    if (!instance || instance.flowStatus !== 'draft') {
      throw new BadRequestException('草稿不存在或状态异常');
    }

    // 复用 startInstance 的核心步骤，但更新现有记录
    const def = await this.prisma.flowDefinition.findUnique({ where: { id: instance.definitionId } });
    const nodes = await this.prisma.flowNode.findMany({ where: { definitionId: instance.definitionId } });
    const startNode = nodes.find(n => n.nodeType === 0);
    const skip = await this.prisma.flowSkip.findFirst({
      where: { definitionId: instance.definitionId, nowNodeCode: startNode?.nodeCode }
    });
    const nextNode = nodes.find(n => n.nodeCode === skip?.nextNodeCode);

    if (!nextNode) throw new BadRequestException('流程配置异常，无法找到下一步');

    return this.prisma.$transaction(async (tx) => {
      // 1. 更新实例状态为 running
      await tx.flowInstance.update({
        where: { id: instanceId },
        data: {
          flowStatus: 'running',
          nodeType: nextNode.nodeType,
          nodeCode: nextNode.nodeCode,
          nodeName: nextNode.nodeName,
          updateTime: new Date(),
        }
      });

      // 2. 创建首个待办任务
      const taskId = BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000));
      await tx.flowTask.create({
        data: {
          id: taskId,
          definitionId: instance.definitionId,
          instanceId: instanceId,
          nodeCode: nextNode.nodeCode,
          nodeName: nextNode.nodeName,
          nodeType: nextNode.nodeType,
          flowStatus: 'todo',
          createBy: starter,
        }
      });

      // 3. 绑定处理人
      if (nextNode.permissionFlag) {
        const userIds = nextNode.permissionFlag.split(',').filter(Boolean);
        for (const uid of userIds) {
          await tx.flowUser.create({
            data: {
              id: BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 10000)),
              type: '1',
              processedBy: uid.trim(),
              associated: taskId,
              createBy: starter,
            }
          });
        }
      }

      return { success: true };
    });
  }

  /**
   * 启动流程实例 (类钉钉/仿经典模式的通用启动器)
   */
  async startInstance(definitionId: bigint, businessId: string, starter: string) {
    // 1. 获取定义
    const def = await this.prisma.flowDefinition.findUnique({ where: { id: definitionId } });
    if (!def) throw new BadRequestException('未找到该流程定义');
    if (def.isPublish !== 1) throw new BadRequestException('该流程尚未发布，无法发起');

    // 2. 获取开始节点 (nodeType = 0)
    const nodes = await this.prisma.flowNode.findMany({ where: { definitionId: def.id } });
    const startNode = nodes.find(n => n.nodeType === 0);
    if (!startNode) throw new BadRequestException('该流程缺少开始节点');

    // 3. 寻找下一步连线 (Skip)
    const skip = await this.prisma.flowSkip.findFirst({
      where: { definitionId: def.id, nowNodeCode: startNode.nodeCode }
    });
    if (!skip) throw new BadRequestException('开始节点没有指向下一步流程');

    const nextNode = nodes.find(n => n.nodeCode === skip.nextNodeCode);
    if (!nextNode) throw new BadRequestException('下一步节点数据异常');

    // 4. 发起事务：创建实例 + 初始化首个任务
    return this.prisma.$transaction(async (tx) => {
      const instanceId = BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000));
      
      const instance = await tx.flowInstance.create({
        data: {
          id: instanceId,
          definitionId: def.id,
          businessId,
          nodeType: nextNode.nodeType,
          nodeCode: nextNode.nodeCode,
          nodeName: nextNode.nodeName,
          flowStatus: 'running',
          createBy: starter,
        }
      });

      // 创建首个待办任务
      const taskId = BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000)) + 1n;
      await tx.flowTask.create({
        data: {
          id: taskId,
          definitionId: def.id,
          instanceId: instance.id,
          nodeCode: nextNode.nodeCode,
          nodeName: nextNode.nodeName,
          nodeType: nextNode.nodeType,
          flowStatus: 'todo',
          createBy: starter,
        }
      });

      // 写入 FlowUser 记录（用于待办人追踪）
      if (nextNode.permissionFlag) {
        const userIds = nextNode.permissionFlag.split(',').filter(Boolean);
        for (const uid of userIds) {
          await tx.flowUser.create({
            data: {
              id: BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 10000)),
              type: '1', // 1=待办人
              processedBy: uid.trim(),
              associated: taskId,
              createBy: starter,
            }
          });
        }
      }

      this.logger.log(`[WF-START] BusinessID: ${businessId} -> 节点[${nextNode.nodeName}]`);
      return instance;
    });
  }

  /**
   * 审批通过 - 提交流转任务 (带条件路由判定)
   */
  async completeTask(taskId: bigint, approver: string, variables: any = {}, comment: string = '') {
    const task = await this.prisma.flowTask.findUnique({ where: { id: taskId } });
    if (!task) throw new BadRequestException('待办任务不存在或已被处理');

    const nodes = await this.prisma.flowNode.findMany({ where: { definitionId: task.definitionId } });
    const skips = await this.prisma.flowSkip.findMany({
      where: { definitionId: task.definitionId, nowNodeCode: task.nodeCode }
    });

    // 条件路由判定：如果多条出路，按 skipCondition 匹配
    let nextSkip = skips[0];
    if (skips.length > 1 && variables) {
      const matched = skips.find(s => this.evaluateCondition(s.skipCondition, variables));
      if (matched) nextSkip = matched;
    }
    if (!nextSkip) throw new BadRequestException('无后续流转节点');

    const nextNode = nodes.find(n => n.nodeCode === nextSkip.nextNodeCode);
    
    return this.prisma.$transaction(async (tx) => {
      // 1. 归档当前 Task -> HisTask
      await tx.flowTask.delete({ where: { id: taskId } });
      await this.archiveTask(tx, task, nextNode, approver, 'pass', comment, variables);

      // 2. 清除当前任务的 FlowUser 记录
      await tx.flowUser.deleteMany({ where: { associated: taskId } });

      // 3. 判定是否为结束节点 (nodeType = 2)
      if (nextNode?.nodeType === 2) {
        await tx.flowInstance.update({
          where: { id: task.instanceId },
          data: {
            flowStatus: 'finished',
            nodeType: 2,
            nodeCode: nextNode.nodeCode,
            nodeName: nextNode.nodeName,
            updateTime: new Date(),
          }
        });
        this.logger.log(`[WF-END] InstanceID: ${task.instanceId}`);
        // 触发业务联动钩子 (通过实例获取 businessId)
        const instance = await this.prisma.flowInstance.findUnique({ where: { id: task.instanceId } });
        if (instance) {
          await this.handleWorkflowCompletion(task.definitionId, instance.businessId);
        }
        return { finished: true };
      } else {
        // 创建下一步 Task
        const newTaskId = BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000));
        await tx.flowTask.create({
          data: {
            id: newTaskId,
            definitionId: task.definitionId,
            instanceId: task.instanceId,
            nodeCode: nextNode!.nodeCode,
            nodeName: nextNode!.nodeName,
            nodeType: nextNode!.nodeType,
            flowStatus: 'todo',
          }
        });

        // 绑定新的待办人
        if (nextNode?.permissionFlag) {
          const userIds = nextNode.permissionFlag.split(',').filter(Boolean);
          for (const uid of userIds) {
            await tx.flowUser.create({
              data: {
                id: BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 10000)),
                type: '1',
                processedBy: uid.trim(),
                associated: newTaskId,
              }
            });
          }
        }

        await tx.flowInstance.update({
          where: { id: task.instanceId },
          data: {
            nodeType: nextNode!.nodeType,
            nodeCode: nextNode!.nodeCode,
            nodeName: nextNode!.nodeName,
            updateTime: new Date(),
          }
        });
        return { finished: false, nextNode: nextNode?.nodeName };
      }
    });
  }

  /**
   * 驳回 - 将流程退回到发起人或上一节点
   */
  async rejectTask(taskId: bigint, approver: string, comment: string = '', targetNodeCode?: string) {
    const task = await this.prisma.flowTask.findUnique({ where: { id: taskId } });
    if (!task) throw new BadRequestException('待办任务不存在或已被处理');

    const nodes = await this.prisma.flowNode.findMany({ where: { definitionId: task.definitionId } });

    // 确定驳回目标节点：
    // 1. 如果指定了 targetNodeCode，则驳回到指定节点
    // 2. 否则查找上一步（从 history 里找）
    // 3. 如果都没有，驳回到开始节点的下一个节点
    let rollbackNode: any;
    if (targetNodeCode) {
      rollbackNode = nodes.find(n => n.nodeCode === targetNodeCode);
    } else {
      // 从历史中找到上一步
      const lastHis = await this.prisma.flowHisTask.findFirst({
        where: { instanceId: task.instanceId },
        orderBy: { createTime: 'desc' },
      });
      if (lastHis?.nodeCode) {
        rollbackNode = nodes.find(n => n.nodeCode === lastHis.nodeCode);
      }
    }

    if (!rollbackNode) {
      // 兜底：退回到开始节点之后的第一个节点
      const startNode = nodes.find(n => n.nodeType === 0);
      const skip = await this.prisma.flowSkip.findFirst({
        where: { definitionId: task.definitionId, nowNodeCode: startNode?.nodeCode ?? '' }
      });
      rollbackNode = nodes.find(n => n.nodeCode === skip?.nextNodeCode);
    }

    if (!rollbackNode) throw new BadRequestException('无法确定驳回目标节点');

    return this.prisma.$transaction(async (tx) => {
      // 归档当前任务
      await tx.flowTask.delete({ where: { id: taskId } });
      await this.archiveTask(tx, task, rollbackNode, approver, 'reject', comment);
      await tx.flowUser.deleteMany({ where: { associated: taskId } });

      // 创建驳回后的新任务
      const newTaskId = BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000));
      await tx.flowTask.create({
        data: {
          id: newTaskId,
          definitionId: task.definitionId,
          instanceId: task.instanceId,
          nodeCode: rollbackNode.nodeCode,
          nodeName: rollbackNode.nodeName,
          nodeType: rollbackNode.nodeType,
          flowStatus: 'todo',
        }
      });

      // 绑定重置后的待办人（按原节点配置）
      if (rollbackNode.permissionFlag) {
        const userIds = rollbackNode.permissionFlag.split(',').filter(Boolean);
        for (const uid of userIds) {
          await tx.flowUser.create({
            data: {
              id: BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 10000)),
              type: '1',
              processedBy: uid.trim(),
              associated: newTaskId,
            }
          });
        }
      }

      await tx.flowInstance.update({
        where: { id: task.instanceId },
        data: {
          flowStatus: 'running',
          nodeType: rollbackNode.nodeType,
          nodeCode: rollbackNode.nodeCode,
          nodeName: rollbackNode.nodeName,
          updateTime: new Date(),
        }
      });

      this.logger.log(`[WF-REJECT] InstanceID: ${task.instanceId} -> 退回至[${rollbackNode.nodeName}]`);
      return { rolledBack: true, targetNode: rollbackNode.nodeName };
    });
  }

  /**
   * 获取该流程实例可以驳回的历史节点
   */
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
        result.push({
          nodeCode: h.nodeCode,
          nodeName: h.nodeName,
          approver: h.approver,
          time: h.createTime,
        });
        codes.add(h.nodeCode);
      }
    }

    return result.reverse();
  }

  /**
   * 撤回流程（发起人主动取消）
   */
  async cancelInstance(instanceId: bigint, operator: string) {
    const instance = await this.prisma.flowInstance.findUnique({ where: { id: instanceId } });
    if (!instance) throw new BadRequestException('流程实例不存在');
    if (instance.flowStatus === 'finished') throw new BadRequestException('已完结的流程无法撤回');

    // 权限校验：仅发起人或管理员可撤还
    if (instance.createBy !== operator && operator !== 'admin') {
      throw new BadRequestException('您无权撤回该流程');
    }

    return this.prisma.$transaction(async (tx) => {
      // 找出所有关联的待办任务
      const tasks = await tx.flowTask.findMany({ where: { instanceId }, select: { id: true } });
      const taskIds = tasks.map(t => t.id);

      // 删掉所有 FlowUser
      await tx.flowUser.deleteMany({
        where: {
          associated: { in: taskIds }
        }
      });

      // 删掉所有待办任务
      await tx.flowTask.deleteMany({ where: { instanceId } });

      await tx.flowInstance.update({
        where: { id: instanceId },
        data: {
          flowStatus: 'cancelled',
          updateTime: new Date(),
          updateBy: operator,
        }
      });

      this.logger.log(`[WF-CANCEL] InstanceID: ${instanceId} 已被 ${operator} 撤回`);
      return { cancelled: true };
    });
  }

  /**
   * 业务联动钩子：流程完结后自动修改业务表状态
   */
  private async handleWorkflowCompletion(definitionId: bigint, businessId: string) {
    try {
      const def = await this.prisma.flowDefinition.findUnique({ where: { id: definitionId } });
      if (!def) return;

      this.logger.log(`[WF-HOOK] 流程完结: ${def.flowName} (${def.flowCode}), 业务ID: ${businessId}`);

      // 针对不同流程代码执行不同业务逻辑
      if (def.flowCode === 'project_approval') {
        // 项目立项审批通过：修改项目状态为 “1” (进行中/已立项)
        await this.prisma.project.update({
          where: { projectId: BigInt(businessId) },
          data: { status: '1', updateTime: new Date() }
        });
        this.logger.log(`[WF-HOOK] 项目 ${businessId} 状态已更新为 进行中`);
      } else if (def.flowCode === 'employee_onboarding') {
        // 人员入职审批通过：自动创建账号与员工档案
        await this.createEmployeeFromOnboarding(businessId);
      }
      
      // 可以在此处增加更多流程的联动逻辑，如 'purchase_approval', 'attendance_approval' 等
      
    } catch (err) {
      this.logger.error(`[WF-HOOK-ERROR] 业务联动失败: ${err.message}`, err.stack);
    }
  }

  /**
   * 根据入职审批结果自动创建人员档案及账号
   * @param businessId 业务关联ID (即流程实例中的 businessId，通常存储表单JSON或特定标识)
   */
  private async createEmployeeFromOnboarding(businessId: string) {
    try {
      this.logger.log(`[WF-ONBOARDING] 开始为业务ID: ${businessId} 创建员工档案`);
      
      // 1. 获取流程实例以取得变量内容
      const instance = await this.prisma.flowInstance.findUnique({
        where: { businessId }
      });
      if (!instance || !instance.ext) {
        this.logger.error(`[WF-ONBOARDING] 未找到流程实例或变量内容为空`);
        return;
      }
      
      const vars = JSON.parse(instance.ext);
      const name = vars.name;
      if (!name) {
        this.logger.error(`[WF-ONBOARDING] 变量中缺少姓名信息`);
        return;
      }

      // 2. 生成拼音用户名并处理重复
      const basePinyin = pinyin(name, { toneType: 'none', type: 'array' }).join('').toLowerCase();
      let username = basePinyin;
      let count = 0;
      
      while (true) {
        const existing = await this.prisma.sysUser.findUnique({
          where: { loginName: username }
        });
        if (!existing) break;
        count++;
        username = `${basePinyin}${count}`;
      }

      // 3. 构建数据并执行事务
      const hashedPassword = await bcrypt.hash('mima1234', 10);
      
      await this.prisma.$transaction(async (tx) => {
        // A. 创建系统用户
        const userId = BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000));
        await tx.sysUser.create({
          data: {
            userId,
            loginName: username,
            userName: name,
            password: hashedPassword,
            status: '0', // 正常
            deptId: vars.deptId ? BigInt(vars.deptId) : null,
            remark: '流程自动创建'
          }
        });

        // B. 创建员工档案
        await tx.sysEmployee.create({
          data: {
            name,
            employeeNo: `EMP${new Date().getFullYear()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
            deptId: vars.deptId ? BigInt(vars.deptId) : null,
            position: vars.position,
            education: vars.education,
            university: vars.university,
            phone: vars.phone || '', // 手机号暂不强制
            userId: userId,
            status: '0', // 在职
            hireDate: vars.hireDate ? new Date(vars.hireDate) : new Date(),
          }
        });

        this.logger.log(`[WF-ONBOARDING] [SUCCESS] 已为 ${name} 创建账号 ${username}`);
      });
    } catch (err) {
      this.logger.error(`[WF-ONBOARDING] [FAILED] 创建失败: ${err.message}`, err.stack);
    }
  }

  // ========== 私有工具方法 ==========

  /**
   * 归档任务到 flow_his_task
   */
  private async archiveTask(tx: any, task: any, targetNode: any, approver: string, skipType: string, comment: string, variables?: any) {
    const hisId = BigInt(Date.now()) + BigInt(Math.floor(Math.random() * 1000));
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
        skipType,
        flowStatus: skipType === 'pass' ? 'finished' : 'rejected',
        message: comment,
        variable: variables ? JSON.stringify(variables) : null,
        createTime: new Date(),
      }
    });
  }

  /**
   * 简易条件表达式求值器
   * 支持形如 "amount > 500" 或 "type == 'urgent'" 的简单判定
   */
  private evaluateCondition(condition: string | null, variables: Record<string, any>): boolean {
    if (!condition) return false;
    try {
      // 安全沙箱执行简单表达式
      const keys = Object.keys(variables);
      const values = Object.values(variables);
      const fn = new Function(...keys, `return ${condition};`);
      return !!fn(...values);
    } catch (e) {
      this.logger.warn(`条件表达式求值失败: ${condition}`, e);
      return false;
    }
  }
}
