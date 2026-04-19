import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkflowController } from './workflow.controller';
import { WorkflowEngineService } from './engine/workflow-engine.service';
import { DefinitionController } from './definition/definition.controller';
import { DefinitionService } from './definition/definition.service';
import { TaskController } from './task/task.controller';
import { TaskQueryService } from './task/task-query.service';
import { MonitorModule } from './monitor/monitor.module';
import { DataFillHandler } from './handlers/data-fill.handler';
import { PermissionHandler } from './handlers/permission.handler';
import { TenantHandler } from './handlers/tenant.handler';
import { HandlerManager } from './handlers/handler-manager';
import { StartService } from './services/start.service';
import { TaskService } from './services/task.service';
import { InstanceService } from './services/instance.service';
import { BusinessService } from './services/business.service';
import { FormService } from './services/form.service';
import { DefService } from './services/def.service';
import { NodeService } from './services/node.service';
import { SkipService } from './services/skip.service';
import { HisTaskService } from './services/his-task.service';
import { UserService } from './services/user.service';
import { ChartService } from './services/chart.service';
import { ListenerManager } from './listeners/listener-manager';
import { GlobalListener } from './listeners/global-listener';
import { StorageManager } from './storage/storage-manager';
import { PrismaAdapter } from './storage/prisma-adapter';
import { DatabaseConfigService } from './database/database-config.service';
import { DatabaseMigrationService } from './database/database-migration.service';
import { FormController } from './controllers/form.controller';
import { WorkflowExceptionFilter } from './exception/workflow-exception.filter';

@Module({
  imports: [MonitorModule],
  controllers: [
    WorkflowController,
    DefinitionController,
    TaskController,
    FormController,
  ],
  providers: [
    WorkflowEngineService,
    DefinitionService,
    TaskQueryService,
    DataFillHandler,
    PermissionHandler,
    TenantHandler,
    HandlerManager,
    StartService,
    TaskService,
    InstanceService,
    BusinessService,
    FormService,
    DefService,
    NodeService,
    SkipService,
    HisTaskService,
    UserService,
    ChartService,
    ListenerManager,
    GlobalListener,
    StorageManager,
    PrismaAdapter,
    DatabaseConfigService,
    DatabaseMigrationService,
    PrismaService,
  ],
  exports: [
    WorkflowEngineService,
    DefinitionService,
    TaskQueryService,
    MonitorModule,
  ],
})
export class WorkflowModule {}
