import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * 任务查询服务
 * 提供待办列表、已办列表、流程实例查询等读模型，适配 V3 前端的高级展示需求
 */
@Injectable()
export class TaskQueryService {
  private readonly logger = new Logger(TaskQueryService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * 获取任务详情 (含流程上下文)
   */
  async getTaskDetail(taskId: string) {
    const task = await this.prisma.flowTask.findUnique({
      where: { id: BigInt(taskId) },
    });

    if (!task) return null;

    const [instance, definition] = await Promise.all([
      this.prisma.flowInstance.findUnique({ where: { id: task.instanceId } }),
      this.prisma.flowDefinition.findUnique({ where: { id: task.definitionId } }),
    ]);

    return {
      ...task,
      id: task.id.toString(),
      instanceId: task.instanceId.toString(),
      definitionId: task.definitionId.toString(),
      definition_key: definition?.flowCode || 'unknown',
      process_title: instance?.businessId || '未命名业务',
      process_type: definition?.flowCode || 'common',
      definition_name: definition?.flowName,
      current_node_id: task.nodeCode,
      current_node_name: task.nodeName,
      initiator_name: instance?.createBy || '系统',
      created_at: task.createTime,
      form_data: instance?.ext ? JSON.parse(instance.ext) : {},
    };
  }

  /**
   * 获取我的待办任务 (精确匹配处理人)
   */
  async getMyTodoTasks(userId: string) {
    // 1. 从 FlowUser 映射表中找出属于该用户的待办关联 (type='1' 为待办人)
    const assignments = await this.prisma.flowUser.findMany({
      where: {
        processedBy: userId,
        type: '1',
      },
      select: { associated: true }
    });

    if (assignments.length === 0) return [];
    
    const taskIds = assignments.map(a => a.associated);

    // 2. 查询对应的待办任务
    const tasks = await this.prisma.flowTask.findMany({
      where: {
        id: { in: taskIds },
        flowStatus: 'todo',
        delFlag: '0',
      },
      orderBy: { createTime: 'desc' },
    });

    if (tasks.length === 0) return [];

    const instanceIds = [...new Set(tasks.map(t => t.instanceId))];
    const definitionIds = [...new Set(tasks.map(t => t.definitionId))];

    // 3. 并行拉取关联信息（实例表、定义表）
    const [instances, definitions] = await Promise.all([
      this.prisma.flowInstance.findMany({ where: { id: { in: instanceIds } } }),
      this.prisma.flowDefinition.findMany({ where: { id: { in: definitionIds } } })
    ]);

    const instanceMap = new Map(instances.map(i => [i.id.toString(), i]));
    const defMap = new Map(definitions.map(d => [d.id.toString(), d]));

    // 4. 聚合为若依标准展示模型
    return tasks.map(task => {
      const inst = instanceMap.get(task.instanceId.toString());
      const def = defMap.get(task.definitionId.toString());
      return {
        id: task.id.toString(),
        task_id: task.id.toString(),
        instance_id: task.instanceId.toString(),
        process_title: inst?.businessId || '未命名业务',
        process_type: def?.flowName || '通用流程',
        node_name: task.nodeName,
        initiator_name: inst?.createBy || '系统',
        status: 'pending',
        create_time: task.createTime,
        form_data: inst?.ext ? JSON.parse(inst.ext) : {},
      };
    });
  }

  async getMyTodoTasksCount(userId: string) {
    const assignments = await this.prisma.flowUser.findMany({
      where: {
        processedBy: userId,
        type: '1',
      },
      select: { associated: true }
    });

    if (assignments.length === 0) return 0;

    const taskIds = assignments.map(a => a.associated);

    return this.prisma.flowTask.count({
      where: {
        id: { in: taskIds },
        flowStatus: 'todo',
        delFlag: '0',
      },
    });
  }

  /**
   * 获取我的已办任务 (基于历史轨迹)
   */
  async getMyDoneTasks(userId: string) {
    const tasks = await this.prisma.flowHisTask.findMany({
      where: {
        approver: userId,
        delFlag: '0',
      },
      orderBy: { createTime: 'desc' },
    });

    if (tasks.length === 0) return [];

    const instanceIds = [...new Set(tasks.map(t => t.instanceId))];
    const definitionIds = [...new Set(tasks.map(t => t.definitionId))];

    const [instances, definitions] = await Promise.all([
      this.prisma.flowInstance.findMany({ where: { id: { in: instanceIds } } }),
      this.prisma.flowDefinition.findMany({ where: { id: { in: definitionIds } } })
    ]);
    
    const instanceMap = new Map(instances.map(i => [i.id.toString(), i]));
    const defMap = new Map(definitions.map(d => [d.id.toString(), d]));

    return tasks.map(task => {
      const inst = instanceMap.get(task.instanceId.toString());
      const def = defMap.get(task.definitionId.toString());
      return {
        id: task.id.toString(),
        task_id: task.taskId.toString(),
        instance_id: task.instanceId.toString(),
        process_title: inst?.businessId || '历史流程',
        process_type: def?.flowName || '通用流程',
        node_name: task.nodeName,
        approver: task.approver,
        result: task.skipType, // pass / reject
        status: task.flowStatus,
        create_time: task.createTime,
        finish_time: task.updateTime,
        message: task.message,
        form_data: inst?.ext ? JSON.parse(inst.ext) : {},
      };
    });
  }

  /**
   * 获取我发起的生命周期实例 (正在运行或已结束，非草稿)
   */
  async getMyInitiatedInstances(userId: string) {
    const instances = await this.prisma.flowInstance.findMany({
      where: {
        createBy: userId,
        flowStatus: { not: 'draft' },
        delFlag: '0',
      },
      orderBy: { createTime: 'desc' },
    });

    if (instances.length === 0) return [];

    const definitionIds = [...new Set(instances.map(i => i.definitionId))];
    const instanceIds = instances.map(i => i.id);

    const [definitions, currentTasks] = await Promise.all([
      this.prisma.flowDefinition.findMany({ where: { id: { in: definitionIds } } }),
      this.prisma.flowTask.findMany({
        where: {
          instanceId: { in: instanceIds },
          flowStatus: 'todo',
          delFlag: '0',
        },
      }),
    ]);

    const defMap = new Map(definitions.map(d => [d.id.toString(), d]));
    const taskMap = new Map<string, typeof currentTasks[0]>();
    currentTasks.forEach(t => {
      const key = t.instanceId.toString();
      if (!taskMap.has(key)) taskMap.set(key, t);
    });

    return instances.map(inst => {
      const def = defMap.get(inst.definitionId.toString());
      const currentTask = taskMap.get(inst.id.toString());
      let formData = {};
      try {
        formData = inst.ext ? JSON.parse(inst.ext) : {};
      } catch (e) {
        formData = {};
      }

      return {
        id: inst.id.toString(),
        instance_id: inst.id.toString(),
        definition_id: inst.definitionId.toString(),
        definition_key: def?.flowCode || 'unknown',
        process_title: inst.businessId || '未命名流程',
        process_type: def?.flowName || '通用流程',
        title: inst.businessId || '未命名流程',
        status: inst.flowStatus,
        result: null,
        node_name: inst.nodeName,
        current_node_id: inst.nodeCode,
        current_node_name: inst.nodeName,
        current_assignee_id: currentTask?.createBy || null,
        current_assignee_name: currentTask?.createBy || null,
        form_data: formData,
        variables: { formData },
        create_time: inst.createTime,
        created_at: inst.createTime,
        updated_at: inst.updateTime,
        initiator_id: inst.createBy,
        initiator_name: inst.createBy,
        business_id: inst.businessId,
      };
    });
  }

  /**
   * 获取我的草稿箱
   */
  async getMyDrafts(userId: string) {
    const drafts = await this.prisma.flowInstance.findMany({
      where: {
        createBy: userId,
        flowStatus: 'draft',
        delFlag: '0',
      },
      orderBy: { createTime: 'desc' },
    });

    if (drafts.length === 0) return [];

    const definitionIds = [...new Set(drafts.map(d => d.definitionId))];
    const definitions = await this.prisma.flowDefinition.findMany({
      where: { id: { in: definitionIds } }
    });
    const defMap = new Map(definitions.map(def => [def.id.toString(), def]));

    return drafts.map(d => {
      const def = defMap.get(d.definitionId.toString());
      return {
        id: d.id.toString(),
        instance_id: d.id.toString(),
        process_title: d.businessId || '未保存草稿',
        process_type: def?.flowName || '未知类型',
        process_type_code: def?.flowCode, // 重要：加载表单所需
        create_time: d.createTime,
        update_time: d.updateTime,
        form_data: d.ext ? JSON.parse(d.ext) : {},
      };
    });
  }

  /**
   * 获取我的抄送任务
   */
  async getMyCCTasks(userId: string) {
    const assignments = await this.prisma.flowUser.findMany({
      where: { processedBy: userId, type: '2' }, // type='2' 为抄送人
      select: { associated: true }
    });

    if (assignments.length === 0) return [];
    const taskIds = assignments.map(a => a.associated);

    const tasks = await this.prisma.flowTask.findMany({
      where: { id: { in: taskIds }, delFlag: '0' },
      orderBy: { createTime: 'desc' },
    });

    if (tasks.length === 0) return [];

    const instanceIds = [...new Set(tasks.map(t => t.instanceId))];
    const [instances, definitions] = await Promise.all([
      this.prisma.flowInstance.findMany({ where: { id: { in: instanceIds } } }),
      this.prisma.flowDefinition.findMany({ where: { id: { in: [...new Set(tasks.map(t => t.definitionId))] } } })
    ]);

    const instanceMap = new Map(instances.map(i => [i.id.toString(), i]));
    const defMap = new Map(definitions.map(d => [d.id.toString(), d]));

    return tasks.map(task => {
      const inst = instanceMap.get(task.instanceId.toString());
      return {
        id: task.id.toString(),
        instance_id: task.instanceId.toString(),
        process_title: inst?.businessId || '抄送流程',
        process_type: defMap.get(task.definitionId.toString())?.flowName || '通用',
        initiator_name: inst?.createBy || '系统',
        status: 'cc',
        create_time: task.createTime,
        form_data: inst?.ext ? JSON.parse(inst.ext) : {},
      };
    });
  }
  async getInstanceTimeline(instanceId: string) {
    const id = BigInt(instanceId);
    const instance = await this.prisma.flowInstance.findUnique({ where: { id } });
    
    if (!instance) {
      return { instance: null, timeline: [], currentTasks: [] };
    }

    const definition = await this.prisma.flowDefinition.findUnique({
      where: { id: instance.definitionId }
    });
    
    const history = await this.prisma.flowHisTask.findMany({
      where: { instanceId: id, delFlag: '0' },
      orderBy: { createTime: 'asc' },
    });

    const currentTasks = await this.prisma.flowTask.findMany({
      where: { instanceId: id, delFlag: '0' },
    });

    const taskIds = currentTasks.map(t => t.id);
    const flowUsers = taskIds.length > 0 ? await this.prisma.flowUser.findMany({
      where: { associated: { in: taskIds }, type: '1' }
    }) : [];
    
    const taskUserMap = new Map<string, string[]>();
    flowUsers.forEach(u => {
      const tid = u.associated.toString();
      if (!taskUserMap.has(tid)) taskUserMap.set(tid, []);
      if (u.processedBy) taskUserMap.get(tid)!.push(u.processedBy);
    });

    let formData = {};
    try {
      formData = instance.ext ? JSON.parse(instance.ext) : {};
    } catch (e) {
      formData = {};
    }

    return {
      instance: {
        id: instance.id.toString(),
        definition_id: instance.definitionId.toString(),
        definition_key: definition?.flowCode || 'unknown',
        title: instance.businessId || '未命名流程',
        status: instance.flowStatus,
        result: null,
        variables: { formData },
        form_data: formData,
        initiator_id: instance.createBy,
        initiator_name: instance.createBy,
        start_time: instance.createTime,
        end_time: null,
        current_node_id: instance.nodeCode,
        current_node_name: instance.nodeName,
        business_id: instance.businessId,
        created_at: instance.createTime,
        updated_at: instance.updateTime,
      },
      timeline: history.map(h => ({
        id: h.id.toString(),
        action: h.skipType === 'pass' ? 'approved' : h.skipType === 'reject' ? 'rejected' : h.skipType === 'rollback' ? 'rollback' : h.skipType === 'add_signer' ? 'add_signer' : h.skipType === 'cc' ? 'cc' : h.skipType === 'transfer' ? 'transfer' : h.skipType,
        node_id: h.nodeCode,
        node_name: h.nodeName,
        status: h.flowStatus,
        operator_id: h.approver,
        operator_name: h.approver,
        comment: h.message,
        cooperateType: h.cooperateType,
        skipType: h.skipType,
        created_at: h.createTime,
      })),
      currentTasks: currentTasks.map(t => ({
        ...t,
        id: t.id.toString(),
        definitionId: t.definitionId.toString(),
        instanceId: t.instanceId.toString(),
        assignees: taskUserMap.get(t.id.toString()) || [],
      })),
    };
  }
}
