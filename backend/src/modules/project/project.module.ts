import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { ProjectExtensionService } from './project-extension.service';
import { ProjectExtensionController } from './project-extension.controller';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [ReportsModule],
  providers: [ProjectService, ProjectExtensionService],
  controllers: [ProjectController, ProjectExtensionController]
})
export class ProjectModule {}
