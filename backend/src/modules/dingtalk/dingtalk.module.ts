import { Module, Global } from '@nestjs/common';
import { DingtalkService } from './dingtalk.service';
import { DingtalkController } from './dingtalk.controller';

@Global()
@Module({
  controllers: [DingtalkController],
  providers: [DingtalkService],
  exports: [DingtalkService],
})
export class DingtalkModule {}
