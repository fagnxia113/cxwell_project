import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController, PersonnelMgmtController } from './project.controller';
import { ProjectExtensionService } from './project-extension.service';
import { ProjectExtensionController } from './project-extension.controller';
import { ReportsModule } from './reports/reports.module';
import { TagsModule } from './tags/tags.module';
import { MilestoneService } from './milestone.service';
import { MilestoneController } from './milestone.controller';
import { TaskBoardController } from './task-board.controller';

@Module({
  imports: [ReportsModule, TagsModule],
  providers: [ProjectService, ProjectExtensionService, MilestoneService],
  controllers: [TaskBoardController, ProjectController, PersonnelMgmtController, ProjectExtensionController, MilestoneController]
})
export class ProjectModule {}
