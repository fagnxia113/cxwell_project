import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { MonitorService } from './monitor.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('workflow/monitor')
@UseGuards(AuthGuard('jwt'))
export class MonitorController {
  constructor(private readonly monitorService: MonitorService) {}

  @Get('statistics')
  async getStatistics() {
    const data = await this.monitorService.getStatistics();
    return { success: true, data };
  }

  @Get('realtime')
  async getRealtime() {
    const data = await this.monitorService.getRealtimeMonitoring();
    return { success: true, data };
  }

  @Get('instances')
  async getInstances(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '50',
    @Query('status') status?: string,
  ) {
    const data = await this.monitorService.getInstances(
      parseInt(page),
      parseInt(pageSize),
      status
    );
    return { success: true, data };
  }

  @Get('instance/:id')
  async getInstanceDetail(@Param('id') id: string) {
    const data = await this.monitorService.getInstanceDetail(BigInt(id));
    return { success: true, data };
  }

  @Get('instance/:id/tasks')
  async getInstanceTasks(@Param('id') id: string) {
    const data = await this.monitorService.getInstanceTasks(BigInt(id));
    return { success: true, data };
  }

  @Post('instance/:id/terminate')
  async terminateInstance(
    @Param('id') id: string,
    @Body('reason') reason: string
  ) {
    await this.monitorService.terminateInstance(BigInt(id), reason);
    return { success: true, message: '流程已终止' };
  }

  @Post('task/:id/reassign')
  async reassignTask(
    @Param('id') id: string,
    @Body('newAssignee') newAssignee: { id: string }
  ) {
    await this.monitorService.reassignTask(BigInt(id), newAssignee.id);
    return { success: true, message: '任务已重新分配' };
  }
}
