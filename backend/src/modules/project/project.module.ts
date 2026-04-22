import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { ProjectExtensionService } from './project-extension.service';
import { ProjectExtensionController } from './project-extension.controller';
import { ReportsModule } from './reports/reports.module';
import { TagsModule } from './tags/tags.module';
import { MilestoneService } from './milestone.service';
import { MilestoneController } from './milestone.controller';

@Module({
  imports: [ReportsModule, TagsModule],
  providers: [ProjectService, ProjectExtensionService, MilestoneService],
  controllers: [ProjectController, ProjectExtensionController, MilestoneController]
})
export class ProjectModule {}
