import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { WorkflowEngineService } from './engine/workflow-engine.service';
import { DefinitionController } from './definition/definition.controller';
import { DefinitionService } from './definition/definition.service';
import { TaskController } from './task/task.controller';
import { TaskQueryService } from './task/task-query.service';
import { MonitorModule } from './monitor/monitor.module';

@Module({
  imports: [MonitorModule],
  controllers: [
    WorkflowController,
    DefinitionController,
    TaskController,
  ],
  providers: [
    WorkflowEngineService,
    DefinitionService,
    TaskQueryService,
  ],
  exports: [
    WorkflowEngineService,
    DefinitionService,
    TaskQueryService,
    MonitorModule,
  ],
})
export class WorkflowModule {}
