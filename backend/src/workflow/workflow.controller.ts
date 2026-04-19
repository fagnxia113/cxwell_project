import { Controller, Post, Body, UseGuards, Req, Get, Param } from '@nestjs/common';
import { WorkflowEngineService } from './engine/workflow-engine.service';
import { AuthGuard } from '@nestjs/passport';
import { TaskQueryService } from './task/task-query.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('workflow')
@UseGuards(AuthGuard('jwt'))
export class WorkflowController {
  constructor(
    private readonly engineService: WorkflowEngineService,
    private readonly taskQueryService: TaskQueryService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('my-pending-tasks/count')
  async getMyPendingTasksCount(@Req() req) {
    const userId = req.user.loginName;
    const count = await this.taskQueryService.getMyTodoTasksCount(userId);
    return {
      success: true,
      data: count,
    };
  }

  @Post('start')
  async startInstance(@Body() body: { definitionId?: string; flowCode?: string; businessId?: string; variables?: any }, @Req() req) {
    const starter = req.user.loginName;
    
    // 如果只有 flowCode，先查询对应的 definitionId
    let targetDefId: bigint;
    if (body.definitionId) {
      targetDefId = BigInt(body.definitionId);
    } else if (body.flowCode) {
      const def = await this.prisma.flowDefinition.findFirst({
        where: { flowCode: body.flowCode, isPublish: 1 },
        orderBy: { version: 'desc' }
      });
      if (!def) throw new Error('未找到已发布的流程定义');
      targetDefId = def.id;
    } else {
      throw new Error('缺失流程定义标识');
    }

    const businessId = body.businessId || `B-${Date.now()}`;
    const instance = await this.engineService.startInstance(targetDefId, businessId, starter);
    
    // 如果有初始变量，保存到实例中 (简捷实现)
    if (body.variables) {
       await this.prisma.flowInstance.update({
         where: { id: instance.id },
         data: { ext: JSON.stringify(body.variables) }
       });
    }

    return {
      success: true,
      data: {
        instanceId: instance.id.toString(),
        flowStatus: instance.flowStatus,
      }
    };
  }

  @Post('complete')
  async completeTask(@Body() body: { taskId: string; comment: string; variables: any }, @Req() req) {
    const approver = req.user.loginName;
    const result = await this.engineService.completeTask(BigInt(body.taskId), approver, body.variables, body.comment);
    return { success: true, data: result };
  }

  @Post('reject')
  async rejectTask(@Body() body: { taskId: string; comment: string; targetNodeCode?: string }, @Req() req) {
    const approver = req.user.loginName;
    const result = await this.engineService.rejectTask(BigInt(body.taskId), approver, body.comment, body.targetNodeCode);
    return { success: true, data: result };
  }

  @Post('cancel')
  async cancelInstance(@Body() body: { instanceId: string }, @Req() req) {
    const operator = req.user.loginName;
    const result = await this.engineService.cancelInstance(BigInt(body.instanceId), operator);
    return { success: true, data: result };
  }

  @Post('active')
  async activeInstance(@Body() body: { instanceId: string }, @Req() req) {
    const operator = req.user.loginName;
    const result = await this.engineService.activeInstance(BigInt(body.instanceId), operator);
    return { success: true, data: result };
  }

  @Post('suspend')
  async suspendInstance(@Body() body: { instanceId: string }, @Req() req) {
    const operator = req.user.loginName;
    const result = await this.engineService.suspendInstance(BigInt(body.instanceId), operator);
    return { success: true, data: result };
  }

  @Get('variables/:instanceId')
  async getVariables(@Param('instanceId') instanceId: string) {
    const variables = await this.engineService.getVariables(BigInt(instanceId));
    return { success: true, data: variables };
  }

  @Post('variables/set')
  async setVariables(@Body() body: { instanceId: string; variables: any }, @Req() req) {
    const operator = req.user.loginName;
    const result = await this.engineService.setVariables(BigInt(body.instanceId), body.variables, operator);
    return { success: true, data: result };
  }

  @Post('variables/remove')
  async removeVariables(@Body() body: { instanceId: string; keys: string[] }, @Req() req) {
    const operator = req.user.loginName;
    const result = await this.engineService.removeVariables(BigInt(body.instanceId), body.keys, operator);
    return { success: true, data: result };
  }
}
