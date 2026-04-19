import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('organization')
@UseGuards(AuthGuard('jwt'))
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
}
