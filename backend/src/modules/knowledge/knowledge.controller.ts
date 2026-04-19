import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('knowledge')
@UseGuards(AuthGuard('jwt'))
export class KnowledgeController {
  @Get()
  async getKnowledge(@Query('type') type: string, @Query('all') all: string) {
    return {
      success: true,
      data: []
    };
  }
}
