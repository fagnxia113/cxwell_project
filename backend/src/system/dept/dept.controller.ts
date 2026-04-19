import { Controller, Get, UseGuards } from '@nestjs/common';
import { DeptService } from './dept.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('system/dept')
@UseGuards(AuthGuard('jwt'))
export class DeptController {
  constructor(private readonly deptService: DeptService) {}

  @Get('tree')
  async getDeptTree() {
    const depts = await this.deptService.findAll();
    const tree = this.deptService.buildDeptTree(depts);
    return {
      success: true,
      data: tree,
    };
  }
}
