import { Controller, Get, Query, Param, Req, Post, Body, Put, Delete } from '@nestjs/common';
import { ProjectService } from './project.service';

@Controller('project')
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

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const data = await this.projectService.updateProject(BigInt(id), body);
    return {
      success: true,
      data,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.projectService.deleteProject(BigInt(id));
    return {
      success: true,
    };
  }
}

@Controller('project/personnel-mgmt')
export class PersonnelMgmtController {
  constructor(private readonly projectService: ProjectService) {}

  @Post(':id/personnel/add')
  async addPersonnel(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    const res = await this.projectService.addMember(BigInt(id), data, req.user);
    return { success: true, data: res };
  }

  @Post(':id/personnel/:employeeId/remove')
  async removePersonnel(@Param('id') id: string, @Param('employeeId') employeeId: string, @Req() req: any) {
    await this.projectService.removeMember(BigInt(id), BigInt(employeeId), req.user);
    return { success: true };
  }

  @Post(':id/personnel/transfer')
  async transferPersonnel(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    const res = await this.projectService.transferMember(BigInt(id), data, req.user);
    return { success: true, data: res };
  }
}
