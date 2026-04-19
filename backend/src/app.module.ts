import { Module } from '@nestjs/common';
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

import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
