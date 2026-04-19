import { Controller, Get, Query, Param, UseGuards, Req } from '@nestjs/common';
import { ProjectService } from './project.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('project')
@UseGuards(AuthGuard('jwt'))
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get('list')
  async getList(
    @Query('pageNum') pageNum: number,
    @Query('pageSize') pageSize: number,
    @Query('projectName') projectName: string,
    @Query('status') status: string,
    @Req() req: any,
  ) {
    const data = await this.projectService.getProjectList({
      pageNum: Number(pageNum) || 1,
      pageSize: Number(pageSize) || 10,
      projectName,
      status,
    }, req.user);
    return {
      success: true,
      data,
    };
  }

  @Get(':id')
  async getDetail(@Param('id') id: string) {
    const data = await this.projectService.getProjectDetail(BigInt(id));
    return {
      success: true,
      data,
    };
  }

  @Get(':id/structure')
  async getStructure(@Param('id') id: string) {
    const data = await this.projectService.getProjectStructure(BigInt(id));
    return {
      success: true,
      data,
    };
  }
}
