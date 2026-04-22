import { Controller, Post, Body, Req, Get, Query, Param, BadRequestException, Logger } from '@nestjs/common';
import { WorkflowEngineService } from './engine/workflow-engine.service';
import { TaskQueryService } from './task/task-query.service';
import { PrismaService } from '../prisma/prisma.service';
import { DefinitionService } from './definition/definition.service';

@Controller('workflow')
export class WorkflowController {
  private readonly logger = new Logger(WorkflowController.name);

  constructor(
    private readonly engineService: WorkflowEngineService,
    private readonly taskQueryService: TaskQueryService,
    private readonly prisma: PrismaService,
    private readonly definitionService: DefinitionService,
  ) { }

  @Get('my-pending-tasks/count')
  async getMyPendingTasksCount(@Req() req) {
    const userId = req.user.loginName;
    const count = await this.taskQueryService.getMyTodoTasksCount(userId);
    return {
      success: true,
      data: count,
    };
  }

  @Get('processes')
  async getProcesses(@Query('initiatorId') initiatorId: string, @Req() req) {
    const userId = initiatorId || req.user.loginName;
    const data = await this.taskQueryService.getMyInitiatedInstances(userId);
    return {
      success: true,
      data,
    };
  }

  @Get('processes/:id')
  async getProcessDetail(@Param('id') id: string) {
    const data = await this.taskQueryService.getInstanceTimeline(id);
    const instance = data.instance;
    if (!instance) {
      return { success: false, data: null };
    }
    return {
      success: true,
      data: instance,
    };
  }

  @Get('processes/:id/logs')
  async getProcessLogs(@Param('id') id: string) {
    const data = await this.taskQueryService.getInstanceTimeline(id);
    return {
      success: true,
      data: data.timeline,
    };
  }

  @Post('processes/:id/withdraw')
  async withdrawProcess(@Param('id') id: string, @Req() req) {
    const userId = req.user.loginName;
    const result = await this.engineService.cancelInstance(BigInt(id), userId);
    return {
      success: true,
      data: result,
    };
  }

  @Get('definitions/:id')
  async getDefinition(@Param('id') id: string) {
    const result = await this.definitionService.findFullDefinition(BigInt(id));
    return {
      success: true,
      data: {
        ...result.definition,
        id: result.definition.id.toString(),
        form_schema: result.definition.ext ? (() => {
          try {
            const parsed = JSON.parse(result.definition.ext);
            return parsed.form_schema || parsed.fields || [];
          } catch {
            return [];
          }
        })() : [],
        nodes: result.nodes.map(n => ({ ...n, id: n.id.toString(), definitionId: n.definitionId.toString() })),
        skips: result.skips.map(s => ({ ...s, id: s.id.toString(), definitionId: s.definitionId.toString() })),
      }
    };
  }

  @Get('v2/tasks/instance/:instanceId')
  async getInstanceTasks(@Param('instanceId') instanceId: string) {
    const data = await this.taskQueryService.getInstanceTimeline(instanceId);
    const tasks = (data.currentTasks || []).map(t => ({
      id: t.id.toString(),
      name: t.nodeName,
      node_id: t.nodeCode,
      status: t.flowStatus === 'todo' ? 'assigned' : t.flowStatus,
      assignee_id: t.approver,
      assignee_name: t.approver,
      result: null,
      comment: null,
      created_at: t.createTime,
      completed_at: null,
    }));
    return {
      success: true,
      data: tasks,
    };
  }

  @Post('v2/tasks/:id/complete')
  async completeTaskV2(
    @Param('id') id: string,
    @Body() body: { action: 'approve' | 'reject'; comment?: string; formData?: any },
    @Req() req
  ) {
    const approver = req.user.loginName;
    const taskId = BigInt(id);

    if (body.action === 'approve') {
      const result = await this.engineService.completeTask(taskId, approver, body.formData || {}, body.comment || '');
      return { success: true, data: result };
    } else {
      const result = await this.engineService.rejectTask(taskId, approver, body.comment || '');
      return { success: true, data: result };
    }
  }

  @Post('start')
  async startInstance(@Body() body: { definitionId?: string; flowCode?: string; businessId?: string; title?: string; variables?: any }, @Req() req) {
    const starter = req.user.loginName;

    let targetDefId: bigint;
    let flowCode = body.flowCode || '';
    let flowName = '';
    if (body.definitionId) {
      targetDefId = BigInt(body.definitionId);
      const def = await this.prisma.flowDefinition.findUnique({ where: { id: targetDefId } });
      if (def) { flowCode = def.flowCode; flowName = def.flowName; }
    } else if (body.flowCode) {
      const def = await this.prisma.flowDefinition.findFirst({
        where: { flowCode: body.flowCode, isPublish: 1 },
        orderBy: { version: 'desc' }
      });
      if (!def) throw new Error('未找到已发布的流程定义');
      targetDefId = def.id;
      flowName = def.flowName;
    } else {
      throw new Error('缺失流程定义标识');
    }

    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const seqNo = String(Math.floor(Math.random() * 9000) + 1000);
    const prefix = flowCode ? flowCode.substring(0, 3).toUpperCase() : 'WF';
    const documentNo = `${prefix}-${dateStr}-${seqNo}`;
    const businessId = body.businessId || documentNo;
    const title = body.title || `${flowName || '流程申请'}-${dateStr}-${seqNo}`;

    const variables = {
      ...(body.variables || {}),
      _title: title,
      _documentNo: documentNo,
      _applyDate: now.toISOString(),
      _applicant: starter,
    };

    const instance = await this.engineService.startInstance(targetDefId, businessId, starter, variables);
    const fullInstance = await this.prisma.flowInstance.findUnique({ where: { id: instance.id } });

    return {
      success: true,
      data: {
        instanceId: instance.id.toString(),
        flowStatus: fullInstance?.flowStatus || 'running',
        documentNo,
        title,
      }
    };
  }

  @Post('complete')
  async completeTask(@Body() body: { taskId: string; comment: string; variables: any }, @Req() req) {
    this.logger.log(`Complete Action: taskId=${body.taskId}, approver=${req.user.loginName}`);
    try {
      const result = await this.engineService.completeTask(BigInt(body.taskId), req.user.loginName, body.variables, body.comment);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error(`Complete operation failed: ${error.message}`);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('审批操作失败');
    }
  }

  @Post('reject')
  async rejectTask(@Body() body: { taskId: string; comment: string }, @Req() req) {
    const approver = req.user.loginName;
    this.logger.log(`Reject Action: taskId=${body.taskId}, approver=${approver}`);

    try {
      const result = await this.engineService.rejectTask(BigInt(body.taskId), approver, body.comment);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error(`Reject operation failed: ${error.message}`);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('驳回操作失败');
    }
  }

  @Post('rollback')
  async rollbackTask(@Body() body: { taskId: string; comment: string; targetNodeCode?: string }, @Req() req) {
    const approver = req.user.loginName;
    this.logger.log(`Rollback Action: taskId=${body.taskId}, approver=${approver}, targetNodeCode=${body.targetNodeCode}`);

    try {
      const result = await this.engineService.rollbackTask(BigInt(body.taskId), approver, body.comment, body.targetNodeCode);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error(`Rollback operation failed: ${error.message}`);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('退回操作失败');
    }
  }

  @Post('predict')
  async predictPath(@Body() body: { instanceId: string; variables?: any }) {
    const path = await this.engineService.predictNextSteps(BigInt(body.instanceId), body.variables || {});
    return {
      success: true,
      data: path,
    };
  }

  @Post('tasks/:id/transfer')
  async transferTask(@Param('id') id: string, @Body() body: { targetUserId: string; comment?: string }, @Req() req) {
    const currentUserId = req.user.loginName;
    console.log(`[Workflow Trace] Transfer Action: taskId=${id}, from=${currentUserId}, to=${body.targetUserId}`);

    try {
      const result = await this.engineService.transferTask(BigInt(id), currentUserId, body.targetUserId, body.comment);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error(`Transfer operation failed: ${error.message}`);
      throw new BadRequestException('转办失败');
    }
  }

  @Post('add-signer')
  async addSigner(@Body() body: { instanceId: string; userIds: string[] }, @Req() req) {
    const creator = req.user.loginName;
    console.log(`[Workflow Trace] Add Signer Action: instanceId=${body.instanceId}, users=${body.userIds}`);

    try {
      const result = await this.engineService.addSigner(BigInt(body.instanceId), body.userIds, creator);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error(`Add-signer operation failed: ${error.message}`);
      throw new BadRequestException('加签失败');
    }
  }

  @Post('copy')
  async copyTo(@Body() body: { instanceId: string; userIds: string[] }, @Req() req) {
    const creator = req.user.loginName;
    const result = await this.engineService.copyTo(BigInt(body.instanceId), body.userIds, creator);
    return { success: true, data: result };
  }
}
