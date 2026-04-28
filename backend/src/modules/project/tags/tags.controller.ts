import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { TagsService } from './tags.service';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  async findAll(@Query('project_id') projectId: string) {
    const data = await this.tagsService.findAll(BigInt(projectId));
    return { success: true, data };
  }

  @Post()
  async create(@Body() body: any, @Req() req: any) {
    const data = await this.tagsService.create({
      projectId: BigInt(body.project_id),
      milestoneId: body.milestone_id ? BigInt(body.milestone_id) : undefined,
      tagType: body.tag_type,
      systemType: body.system_type,
      requiredCount: Number(body.required_count) || 0,
      taggedCount: Number(body.tagged_count) || 0,
      verifiedCount: Number(body.verified_count) || 0,
      abnormalCount: Number(body.abnormal_count) || 0,
    }, req.user);
    return { success: true, data };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const data = await this.tagsService.update(BigInt(id), {
      tagType: body.tag_type,
      systemType: body.system_type,
      requiredCount: body.required_count !== undefined ? Number(body.required_count) : undefined,
      taggedCount: body.tagged_count !== undefined ? Number(body.tagged_count) : undefined,
      verifiedCount: body.verified_count !== undefined ? Number(body.verified_count) : undefined,
      abnormalCount: body.abnormal_count !== undefined ? Number(body.abnormal_count) : undefined,
      milestoneId: body.milestone_id ? BigInt(body.milestone_id) : undefined,
    }, req.user);
    return { success: true, data };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    return await this.tagsService.remove(BigInt(id), req.user);
  }
}
