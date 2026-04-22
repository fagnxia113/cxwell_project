import { Controller, Get, Post, Body, Param, Request } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { TaskQueryService } from './task-query.service';
import { WorkflowEngineService } from '../engine/workflow-engine.service';

@Controller('workflow/tasks')
export class TaskController {
  private readonly logger = new Logger(TaskController.name);

  constructor(
    private readonly taskQueryService: TaskQueryService,
    private readonly workflowEngine: WorkflowEngineService,
  ) { }

  /**
   * 获取当前用户的待办任务
   */
  @Get('todo')
  async getTodoTasks(@Request() req: any) {
    const userId = req.user.loginName; // 使用 loginName 标识
    const tasks = await this.taskQueryService.getMyTodoTasks(userId);
    return {
      success: true,
      data: tasks
    };
  }

  @Get('done')
  async getDoneTasks(@Request() req: any) {
    const userId = req.user.loginName;
    const tasks = await this.taskQueryService.getMyDoneTasks(userId);
    return {
      success: true,
      data: tasks
    };
  }

  @Get('hub/todo')
  async hubTodo(@Request() req: any) {
    const data = await this.taskQueryService.getMyTodoTasks(req.user.loginName);
    return { success: true, data };
  }

  @Get('hub/done')
  async hubDone(@Request() req: any) {
    const data = await this.taskQueryService.getMyDoneTasks(req.user.loginName);
    return { success: true, data };
  }

  @Get('hub/own')
  async hubOwn(@Request() req: any) {
    const data = await this.taskQueryService.getMyInitiatedInstances(req.user.loginName);
    return { success: true, data };
  }

  @Get('hub/draft')
  async hubDraft(@Request() req: any) {
    const data = await this.taskQueryService.getMyDrafts(req.user.loginName);
    return { success: true, data };
  }

  @Get('hub/cc')
  async hubCC(@Request() req: any) {
    const data = await this.taskQueryService.getMyCCTasks(req.user.loginName);
    return { success: true, data };
  }

  @Get('hub/todo/count')
  async hubTodoCount(@Request() req: any) {
    const count = await this.taskQueryService.getMyTodoTasksCount(req.user.loginName);
    return { success: true, data: { count } };
  }

  @Get(':id/detail')
  async getTaskDetail(@Param('id') id: string) {
    const data = await this.taskQueryService.getTaskDetail(id);
    return { success: true, data };
  }

  @Post('draft/save')
  async saveDraft(@Body() body: { definitionId: string; businessId: string; variables: any }, @Request() req: any) {
    const data = await this.workflowEngine.saveDraft(
      BigInt(body.definitionId),
      body.businessId,
      req.user.loginName,
      body.variables
    );
    return { success: true, data };
  }

  @Post('draft/:id/submit')
  async submitDraft(@Param('id') id: string, @Request() req: any) {
    const data = await this.workflowEngine.submitDraft(BigInt(id), req.user.loginName);
    return { success: true, data };
  }

  /**
   * 获取特定流程实例的流转轴
   */
  @Get('timeline/:instanceId')
  async getTimeline(@Param('instanceId') instanceId: string) {
    const data = await this.taskQueryService.getInstanceTimeline(instanceId);
    return {
      success: true,
      data
    };
  }

  @Get('history/:instanceId')
  async getHistory(@Param('instanceId') instanceId: string) {
    const data = await this.workflowEngine.getApprovableHistory(BigInt(instanceId));
    return {
      success: true,
      data,
    };
  }

  @Post('reject')
  async reject(@Body() body: { taskId: string; comment: string }, @Request() req: any) {
    const data = await this.workflowEngine.rejectTask(
      BigInt(body.taskId),
      req.user.loginName,
      body.comment
    );
    return {
      success: true,
      data,
    };
  }

  @Post('rollback')
  async rollback(@Body() body: { taskId: string; comment: string; targetNodeCode?: string }, @Request() req: any) {
    const data = await this.workflowEngine.rollbackTask(
      BigInt(body.taskId),
      req.user.loginName,
      body.comment,
      body.targetNodeCode
    );
    return {
      success: true,
      data,
    };
  }

  /**
   * 提交任务办理决策
   */
  @Post(':id/submit')
  async submitTask(
    @Param('id') id: string,
    @Body() body: { action: 'pass' | 'reject' | 'rollback'; variables?: any; message?: string; targetNodeCode?: string },
    @Request() req: any
  ) {
    const taskId = BigInt(id);
    const approver = req.user.loginName;
    const { action, variables = {}, message = '', targetNodeCode } = body;

    this.logger.log(`Submit Task: taskId=${id}, action=${action}, approver=${approver}`);

    try {
      if (action === 'pass') {
        const result = await this.workflowEngine.completeTask(taskId, approver, variables, message);
        return { success: true, data: result };
      } else if (action === 'rollback') {
        const result = await this.workflowEngine.rollbackTask(taskId, approver, message, targetNodeCode);
        return { success: true, data: result };
      } else {
        const result = await this.workflowEngine.rejectTask(taskId, approver, message);
        return { success: true, data: result };
      }
    } catch (error) {
      this.logger.error(`Submit task failed: ${error.message}`);
      throw error;
    }
  }

  @Post(':id/transfer')
  async transferTask(
    @Param('id') id: string,
    @Body() body: { targetUserId: string; comment?: string },
    @Request() req: any
  ) {
    const taskId = BigInt(id);
    const currentUserId = req.user.loginName;
    const result = await this.workflowEngine.transferTask(taskId, currentUserId, body.targetUserId, body.comment);
    return { success: true, data: result };
  }
}
