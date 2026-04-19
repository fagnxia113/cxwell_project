import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { MenuService } from './menu.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('system/menu')
@UseGuards(AuthGuard('jwt'))
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('treelist')
  async findAll() {
    const tree = await this.menuService.findAll();
    return {
      success: true,
      data: tree
    };
  }

  @Post()
  async create(@Body() body: any) {
    const data = await this.menuService.create(body);
    return { success: true, data };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    await this.menuService.update(id, body);
    return { success: true };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.menuService.remove(id);
    return { success: true };
  }
}
