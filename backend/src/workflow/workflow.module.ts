import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { WorkflowEngineService } from './engine/workflow-engine.service';
import { DefinitionController } from './definition/definition.controller';
import { DefinitionService } from './definition/definition.service';
import { TaskController } from './task/task.controller';
import { TaskQueryService } from './task/task-query.service';
import { MonitorModule } from './monitor/monitor.module';

import { WorkflowFormTemplateController } from './definition/workflow-form-template.controller';
import { FormModule } from '../modules/form/form.module';
import { NotificationModule } from '../modules/notification/notification.module';
import { DingtalkModule } from '../modules/dingtalk/dingtalk.module';

@Module({
  imports: [MonitorModule, FormModule, NotificationModule, DingtalkModule],
  controllers: [
    WorkflowController,
    DefinitionController,
    TaskController,
    WorkflowFormTemplateController,
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
    NotificationModule,
  ],
})
export class WorkflowModule { }
