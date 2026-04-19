import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('personnel')
@UseGuards(AuthGuard('jwt'))
export class PersonnelController {
  constructor(private prisma: PrismaService) {}

  @Get('employees')
  async getEmployees(@Query('pageSize') pageSize: string = '1000') {
    const size = Number(pageSize) || 1000;
    const list = await this.prisma.sysEmployee.findMany({
      take: size,
      orderBy: { createTime: 'desc' }
    });

    return {
      success: true,
      data: list.map(item => ({
        ...item,
        employeeId: item.employeeId.toString(),
        deptId: item.deptId?.toString(),
        userId: item.userId?.toString()
      }))
    };
  }
}
