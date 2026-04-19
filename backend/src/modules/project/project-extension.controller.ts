import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ProjectExtensionService } from './project-extension.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('project/extension')
@UseGuards(AuthGuard('jwt'))
export class ProjectExtensionController {
  constructor(private readonly extensionService: ProjectExtensionService) {}

  // ---- Risks ----
  @Get(':projectId/risks')
  async getRisks(@Param('projectId') projectId: string) {
    const data = await this.extensionService.getRisks(BigInt(projectId));
    return { success: true, data };
  }

  @Post(':projectId/risks')
  async addRisk(@Param('projectId') projectId: string, @Body() data: any) {
    const res = await this.extensionService.addRisk(BigInt(projectId), data);
    return { success: true, data: res };
  }

  @Put('risks/:id')
  async updateRisk(@Param('id') id: string, @Body() data: any) {
    const res = await this.extensionService.updateRisk(BigInt(id), data);
    return { success: true, data: res };
  }

  @Delete('risks/:id')
  async deleteRisk(@Param('id') id: string) {
    await this.extensionService.deleteRisk(BigInt(id));
    return { success: true };
  }

  // ---- Expenses ----
  @Get(':projectId/expenses')
  async getExpenses(@Param('projectId') projectId: string) {
    const data = await this.extensionService.getExpenses(BigInt(projectId));
    return { success: true, data };
  }

  @Post(':projectId/expenses')
  async addExpense(@Param('projectId') projectId: string, @Body() data: any) {
    const res = await this.extensionService.addExpense(BigInt(projectId), data);
    return { success: true, data: res };
  }

  @Delete('expenses/:id')
  async deleteExpense(@Param('id') id: string) {
    await this.extensionService.deleteExpense(BigInt(id));
    return { success: true };
  }

  // ---- Staffing Plans ----
  @Get(':projectId/staffing-plans')
  async getStaffingPlans(@Param('projectId') projectId: string) {
    const data = await this.extensionService.getStaffingPlans(BigInt(projectId));
    return { success: true, data };
  }

  @Post(':projectId/staffing-plans')
  async addStaffingPlan(@Param('projectId') projectId: string, @Body() data: any) {
    const res = await this.extensionService.addStaffingPlan(BigInt(projectId), data);
    return { success: true, data: res };
  }

  @Delete('staffing-plans/:id')
  async deleteStaffingPlan(@Param('id') id: string) {
    await this.extensionService.deleteStaffingPlan(BigInt(id));
    return { success: true };
  }

  // ---- Personnel Permissions ----
  @Put(':projectId/personnel/:employeeId/permission')
  async updatePersonnelPermission(
    @Param('projectId') projectId: string,
    @Param('employeeId') employeeId: string,
    @Body('canEdit') canEdit: boolean
  ) {
    const res = await this.extensionService.updatePersonnelPermission(BigInt(projectId), BigInt(employeeId), canEdit);
    return { success: true, data: res };
  }
}
