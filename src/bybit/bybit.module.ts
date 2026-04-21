import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BybitController } from './bybit.controller';
import { BybitService } from './bybit.service';

@Module({
  imports: [ConfigModule],
  controllers: [BybitController],
  providers: [BybitService],
  exports: [BybitService],
})
export class BybitModule {}
