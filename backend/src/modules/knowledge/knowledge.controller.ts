import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { KnowledgeService } from './knowledge.service';
import { CreateKnowledgeDto } from './dto/create-knowledge.dto';
import { UpdateKnowledgeDto } from './dto/update-knowledge.dto';

@Controller('knowledge')
@UseGuards(AuthGuard('jwt'))
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Get()
  async findAll(
    @Request() req: any,
    @Query('type') type?: string,
    @Query('parent_id') parentId?: string,
    @Query('search') search?: string,
    @Query('all') all?: string,
  ) {
    const userId = req.user?.userId || 1; // 默认用户 1
    const data = await this.knowledgeService.findAll(userId, type, parentId, search, all);
    return {
      success: true,
      data: data.map((item) => ({
        id: item.id.toString(),
        title: item.title,
        type: item.type,
        author: item.createdBy?.toString(),
        date: item.createdAt.toISOString(),
        url: item.fileUrl,
        is_folder: item.isFolder,
        parent_id: item.parentId?.toString(),
      })),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.userId || 1;
    const item = await this.knowledgeService.findOne(id, userId);
    return {
      success: true,
      data: {
        id: item.id.toString(),
        title: item.title,
        type: item.type,
        content: item.content,
        url: item.fileUrl,
        is_folder: item.isFolder,
        parent_id: item.parentId?.toString(),
        visibility_type: item.visibilityType,
        author: item.createdBy?.toString(),
        date: item.createdAt.toISOString(),
      },
    };
  }

  @Get(':id/is-empty')
  async checkIsEmpty(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.userId || 1;
    const data = await this.knowledgeService.checkIsEmpty(id, userId);
    return { success: true, data };
  }

  @Post()
  async create(@Body() createKnowledgeDto: CreateKnowledgeDto, @Request() req: any) {
    const userId = req.user?.userId || 1;
    const item = await this.knowledgeService.create(createKnowledgeDto, userId);
    return {
      success: true,
      data: { id: item.id.toString() },
    };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateKnowledgeDto: UpdateKnowledgeDto,
    @Request() req: any,
  ) {
    const userId = req.user?.userId || 1;
    await this.knowledgeService.update(id, updateKnowledgeDto, userId);
    return { success: true };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.userId || 1;
    await this.knowledgeService.remove(id, userId);
    return { success: true };
  }
}
