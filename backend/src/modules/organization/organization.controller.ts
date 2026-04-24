import { Controller, Get, Query, Param, Post, Put, Delete, Body, Req } from '@nestjs/common';
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

  @Get('departments')
  async getDepartments() {
    const data = await this.organizationService.getDeptTree();
    return {
      success: true,
      data,
    };
  }

  @Get('positions')
  async getPositions(@Query() query: any) {
    const data = await this.organizationService.getPositionList(query);
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
  async createDept(@Body() data: any, @Req() req: any) {
    const creator = req.user?.loginName || 'admin';
    const result = await this.organizationService.createDept(data, creator);
    return {
      success: true,
      data: result,
    };
  }

  @Put('departments/:id')
  async updateDept(@Param('id') id: string, @Body() data: any, @Req() req: any) {
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
  async createPosition(@Body() data: any, @Req() req: any) {
    const creator = req.user?.loginName || 'admin';
    const result = await this.organizationService.createPosition(data, creator);
    return {
      success: true,
      data: result,
    };
  }

  @Put('positions/:id')
  async updatePosition(@Param('id') id: string, @Body() data: any, @Req() req: any) {
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
  async updateEmployee(@Param('id') id: string, @Body() data: any, @Req() req: any) {
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

  @Get('report-tree')
  async getReportTree() {
    const data = await this.organizationService.getReportTree();
    return {
      success: true,
      data,
    };
  }

  @Put('report-to/:employeeId')
  async updateReportTo(
    @Param('employeeId') employeeId: string,
    @Body() body: { reportToId: string | null },
  ) {
    const result = await this.organizationService.updateReportTo(employeeId, body.reportToId);
    return {
      success: true,
      data: {
        employeeId: result.employeeId.toString(),
        reportToId: result.reportToId?.toString() || null,
        reportToName: (result as any).reportTo?.name || null,
      },
    };
  }

  @Post('report-to/batch')
  async batchUpdateReportTo(
    @Body() body: { updates: { employeeId: string; reportToId: string | null }[] },
  ) {
    const results = await this.organizationService.batchUpdateReportTo(body.updates);
    return {
      success: true,
      data: results,
    };
  }

  @Get('superior-chain/:employeeId')
  async getSuperiorChain(@Param('employeeId') employeeId: string) {
    const data = await this.organizationService.getSuperiorChain(employeeId);
    return {
      success: true,
      data,
    };
  }

  @Get('subordinates/:employeeId')
  async getSubordinates(
    @Param('employeeId') employeeId: string,
    @Query('recursive') recursive: string,
  ) {
    const data = await this.organizationService.getSubordinates(employeeId, recursive === 'true');
    return {
      success: true,
      data,
    };
  }

  @Put('dept-leader/:deptId')
  async updateDeptLeader(
    @Param('deptId') deptId: string,
    @Body() body: { leaderId: string | null },
  ) {
    const result = await this.organizationService.updateDeptLeader(deptId, body.leaderId);
    return {
      success: true,
      data: {
        deptId: result.deptId.toString(),
        leaderId: result.leaderId?.toString() || null,
        leaderName: (result as any).leaderEmployee?.name || null,
      },
    };
  }
}

@Controller('personnel')
export class PersonnelController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get('employees')
  async getEmployees(@Query() query: any, @Req() req: any) {
    const data = await this.organizationService.getEmployeeList(query, req.user);
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

  @Get('rotation/plan/:employeeId/:yearMonth')
  async getRotationPlan(
    @Param('employeeId') employeeId: string,
    @Param('yearMonth') yearMonth: string,
  ) {
    const data = await this.organizationService.getRotationPlan(employeeId, yearMonth);
    return {
      success: true,
      data,
    };
  }

  @Post('rotation/plan/:employeeId/:yearMonth')
  async saveRotationPlan(
    @Param('employeeId') employeeId: string,
    @Param('yearMonth') yearMonth: string,
    @Body() body: { segments: any[] },
  ) {
    const data = await this.organizationService.saveRotationPlan(employeeId, yearMonth, body.segments);
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
