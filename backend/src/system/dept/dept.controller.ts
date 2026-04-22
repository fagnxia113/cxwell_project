import { Controller, Get } from '@nestjs/common';
import { DeptService } from './dept.service';

@Controller('system/dept')
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
