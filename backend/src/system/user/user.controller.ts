import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Patch } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('system/user')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('list')
  async findAll() {
    const users = await this.userService.findAll();
    return {
      success: true,
      data: users.map(user => ({
        ...user,
        userId: user.userId.toString(),
        deptId: user.deptId?.toString(),
      }))
    };
  }

  @Post()
  async create(@Body() body: any) {
    const data = await this.userService.create(body);
    return { success: true, data };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    await this.userService.update(id, body);
    return { success: true };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.userService.remove(id);
    return { success: true };
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    await this.userService.updateStatus(id, status);
    return { success: true };
  }

  @Post(':id/reset-password')
  async resetPassword(@Param('id') id: string, @Body('newPassword') newPassword: string) {
    await this.userService.resetPassword(id, newPassword);
    return { success: true };
  }
}
