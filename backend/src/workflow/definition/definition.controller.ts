import { Controller, Get, Post, Body, Param, Req } from '@nestjs/common';
import { DefinitionService } from './definition.service';

@Controller('workflow/definition')
export class DefinitionController {
  constructor(private readonly defService: DefinitionService) {}

  @Get('list')
  async list() {
    const defs = await this.defService.findAll();
    return {
      success: true,
      data: defs.map(d => ({ ...d, id: d.id.toString() })),
    };
  }

  @Get(':id')
  async getFullDefinition(@Param('id') id: string) {
    const result = await this.defService.findFullDefinition(BigInt(id));
    return {
      success: true,
      data: {
        definition: { ...result.definition, id: result.definition.id.toString() },
        nodes: result.nodes.map(n => ({ ...n, id: n.id.toString(), definitionId: n.definitionId.toString() })),
        skips: result.skips.map(s => ({ ...s, id: s.id.toString(), definitionId: s.definitionId.toString() })),
      }
    };
  }

  @Post('create')
  async create(@Body() body: { flowCode: string; flowName: string; category?: string; version: string }, @Req() req) {
    const def = await this.defService.createDefinition({
      ...body,
      createBy: req.user.loginName,
    });
    return { success: true, data: { ...def, id: def.id.toString() } };
  }

  @Post(':id/design')
  async saveDesign(@Param('id') id: string, @Body() body: { nodes: any[]; skips: any[] }, @Req() req) {
    await this.defService.saveDesign(BigInt(id), body, req.user.loginName);
    return { success: true, message: '流程设计保存成功' };
  }

  @Post(':id/publish')
  async publish(@Param('id') id: string) {
    const def = await this.defService.publish(BigInt(id));
    return { success: true, data: { ...def, id: def.id.toString() } };
  }
}
