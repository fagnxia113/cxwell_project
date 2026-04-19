import { Module } from '@nestjs/common';
import { PersonnelController } from './personnel.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PersonnelController],
})
export class PersonnelModule {}
