import { Controller, Get, Query, Param, Post, Put, Delete, Body, Request } from '@nestjs/common';
import { OrganizationService } from './organization.service';

@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get('dept/tree')
  async getDeptTree() {
    const data = await this.organizationService.getDeptTree();
    return {
      success: true,
      data,
    };
  }

  // Frontend Alias for Knowledge Page and others
  @Get('departments')
  async getDepartments() {
    const data = await this.organizationService.getDeptTree();
    return {
      success: true,
      data,
    };
  }

  // Frontend Alias
  @Get('positions')
  async getPositions(@Query() query: any) {
    const data = await this.organizationService.getPositionList(query);
    // Return flat list specifically for some frontend components that expect data.list or data directly
    return {
      success: true,
      data: data.list,
      total: data.total
    };
  }

  @Get('employee/list')
  async getEmployeeList(
    @Query('pageNum') pageNum: number,
    @Query('pageSize') pageSize: number,
    @Query('name') name: string,
    @Query('deptId') deptId: string,
  ) {
    const data = await this.organizationService.getEmployeeList({
      pageNum: Number(pageNum) || 1,
      pageSize: Number(pageSize) || 10,
      name,
      deptId,
    });
    return {
      success: true,
      data,
    };
  }

  @Get('position/list')
  async getPositionList(
    @Query('pageNum') pageNum: number,
    @Query('pageSize') pageSize: number,
    @Query('postName') postName: string,
    @Query('status') status: string,
  ) {
    const data = await this.organizationService.getPositionList({
      pageNum: Number(pageNum) || 1,
      pageSize: Number(pageSize) || 10,
      postName,
      status,
    });
    return {
      success: true,
      data,
    };
  }

  @Post('departments')
  async createDept(@Body() data: any, @Request() req: any) {
    const creator = req.user?.loginName || 'admin';
    const result = await this.organizationService.createDept(data, creator);
    return {
      success: true,
      data: result,
    };
  }

  @Put('departments/:id')
  async updateDept(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    const updater = req.user?.loginName || 'admin';
    const result = await this.organizationService.updateDept(id, data, updater);
    return {
      success: true,
      data: result,
    };
  }

  @Delete('departments/:id')
  async deleteDept(@Param('id') id: string) {
    await this.organizationService.deleteDept(id);
    return {
      success: true,
    };
  }

  @Post('positions')
  async createPosition(@Body() data: any, @Request() req: any) {
    const creator = req.user?.loginName || 'admin';
    const result = await this.organizationService.createPosition(data, creator);
    return {
      success: true,
      data: result,
    };
  }

  @Put('positions/:id')
  async updatePosition(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    const updater = req.user?.loginName || 'admin';
    const result = await this.organizationService.updatePosition(id, data, updater);
    return {
      success: true,
      data: result,
    };
  }

  @Delete('positions/:id')
  async deletePosition(@Param('id') id: string) {
    await this.organizationService.deletePosition(id);
    return {
      success: true,
    };
  }

  @Get('employee/:id')
  async getEmployeeById(@Param('id') id: string) {
    const data = await this.organizationService.getEmployeeById(id);
    return {
      success: true,
      data,
    };
  }

  @Put('employee/:id')
  async updateEmployee(@Param('id') id: string, @Body() data: any, @Request() req: any) {
    const updater = req.user?.loginName || 'admin';
    const result = await this.organizationService.updateEmployee(id, data, updater);
    return {
      success: true,
      data: result,
    };
  }

  @Delete('employee/:id')
  async deleteEmployee(@Param('id') id: string) {
    await this.organizationService.deleteEmployee(id);
    return {
      success: true,
    };
  }
}

@Controller('personnel')
export class PersonnelController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get('employees')
  async getEmployees(@Query() query: any) {
    const data = await this.organizationService.getEmployeeList(query);
    return {
      success: true,
      data: data.list,
      total: data.total
    };
  }

  @Get('rotation/project-report/:projectId/:month')
  async getProjectReport(
    @Param('projectId') projectId: string,
    @Param('month') month: string,
  ) {
    const data = await this.organizationService.getProjectRotationReport(projectId, month);
    return {
      success: true,
      data,
    };
  }
}

@Controller('attendance')
export class AttendanceController {
  @Post('sync/dingtalk')
  async syncDingTalk() {
    // Mock sync logic
    return {
      success: true,
      message: 'Attendance data synchronized successfully from DingTalk'
    };
  }
}
