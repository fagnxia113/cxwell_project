import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { RoleService } from './role.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('system/role')
@UseGuards(AuthGuard('jwt'))
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get('list')
  async findAll() {
    const roles = await this.roleService.findAll();
    return {
      success: true,
      data: roles.map(role => ({
        ...role,
        roleId: role.roleId.toString(),
      }))
    };
  }

  @Post()
  async create(@Body() body: any) {
    const data = await this.roleService.create(body);
    return { success: true, data };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    await this.roleService.update(id, body);
    return { success: true };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.roleService.remove(id);
    return { success: true };
  }

  @Get(':id/menu-ids')
  async getRoleMenuIds(@Param('id') id: string) {
    const menuIds = await this.roleService.getRoleMenuIds(id);
    return { success: true, menuIds };
  }

  @Post(':id/permissions')
  async updateRolePermissions(@Param('id') id: string, @Body('menuIds') menuIds: string[]) {
    await this.roleService.updateRolePermissions(id, menuIds);
    return { success: true };
  }
}
