import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CustomThrottlerGuard } from './common/custom-throttler.guard';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './system/user/user.module';
import { DeptModule } from './system/dept/dept.module';
import { RoleModule } from './system/role/role.module';
import { MenuModule } from './system/menu/menu.module';
import { WorkflowModule } from './workflow/workflow.module';
import { ProjectModule } from './modules/project/project.module';
import { CustomerModule } from './modules/customer/customer.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { FormModule } from './modules/form/form.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { NotificationModule } from './modules/notification/notification.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { UploadModule } from './modules/upload/upload.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';

import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 1000 }]),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), process.env.UPLOAD_PATH || 'uploads'),
      serveRoot: '/api/files',
      serveStaticOptions: {
        index: false,
      },
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    DeptModule,
    RoleModule,
    MenuModule,
    WorkflowModule,
    ProjectModule,
    CustomerModule,
    OrganizationModule,
    FormModule,
    DashboardModule,
    NotificationModule,
    KnowledgeModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: CustomThrottlerGuard },
  ],
})
export class AppModule {}
