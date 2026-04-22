import { Controller, Post, Put, Param, Body, Req } from '@nestjs/common';
import { MilestoneService } from './milestone.service';

@Controller('milestones')
export class MilestoneController {
  constructor(private readonly milestoneService: MilestoneService) {}

  @Post('project/:projectId')
  async saveMilestones(
    @Param('projectId') projectId: string,
    @Body() body: { milestones: any[] },
    @Req() req: any,
  ) {
    const result = await this.milestoneService.saveMilestones(
      BigInt(projectId),
      body.milestones || [],
      req.user,
    );
    return {
      success: true,
      data: result,
    };
  }

  @Put(':id/progress')
  async updateProgress(
    @Param('id') id: string,
    @Body() body: { progress: number; status?: string },
  ) {
    const result = await this.milestoneService.updateProgress(
      BigInt(id),
      body.progress,
      body.status,
    );
    return {
      success: true,
      data: result,
    };
  }
}
