import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController, PersonnelController } from './organization.controller';

@Module({
  providers: [OrganizationService],
  controllers: [OrganizationController, PersonnelController]
})
export class OrganizationModule {}
