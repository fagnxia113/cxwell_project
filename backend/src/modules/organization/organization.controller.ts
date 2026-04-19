import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('organization')
@UseGuards(AuthGuard('jwt'))
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  // 部门相关端点
  @Get('dept/tree')
  async getDeptTree() {
    const data = await this.organizationService.getDeptTree();
    return {
      success: true,
      data,
    };
  }

  @Get('departments')
  async getDepartments(@Query('tree') tree: string) {
    if (tree === 'true') {
      const data = await this.organizationService.getDeptTree();
      return {
        success: true,
        data,
      };
    }
    const data = await this.organizationService.getDeptTree();
    return {
      success: true,
      data,
    };
  }

  // 员工相关端点
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

  // 岗位相关端点
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

  @Get('positions')
  async getPositions() {
    const data = await this.organizationService.getPositionList({
      pageSize: 1000,
    });
    return {
      success: true,
      data,
    };
  }
}
