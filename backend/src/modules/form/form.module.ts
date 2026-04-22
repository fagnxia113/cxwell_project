import { Module } from '@nestjs/common';
import { FormService } from './form.service';
import { FormController } from './form.controller';

@Module({
  providers: [FormService],
  controllers: [FormController],
  exports: [FormService]
})
export class FormModule {}
