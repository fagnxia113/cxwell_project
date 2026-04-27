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
import { EmployeeOnboardingHandler } from './handlers/employee-onboarding.handler';
import { ProjectApprovalHandler } from './handlers/project-approval.handler';
import { ProjectCompletionHandler } from './handlers/project-completion.handler';
import { ExpenseSyncHandler } from './handlers/expense-sync.handler';
import { EmployeeResignationHandler } from './handlers/employee-resignation.handler';
import { LeaveApprovalHandler } from './handlers/leave-approval.handler';
import { EmployeeInviteHandler } from './handlers/employee-invite.handler';

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
    EmployeeOnboardingHandler,
    ProjectApprovalHandler,
    ProjectCompletionHandler,
    ExpenseSyncHandler,
    EmployeeResignationHandler,
    LeaveApprovalHandler,
    EmployeeInviteHandler,
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
