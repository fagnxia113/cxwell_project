import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProjectModule } from '../project/project.module';

@Module({
  imports: [PrismaModule, ProjectModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
