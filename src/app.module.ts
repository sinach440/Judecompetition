import * as path from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramModule } from './telegram/telegram.module';
import { VerificationModule } from './verification/verification.module';
import { VerificationController } from './verification/verification.controller';
import { PendingUidRequest } from './storage/entities/pending-uid-request.entity';
import { UserStep } from './storage/entities/user-step.entity';
import { VerifiedUser } from './storage/entities/verified-user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'sqljs',
      location: path.join(process.cwd(), 'data', 'verified.sqlite'),
      autoSave: true,
      entities: [VerifiedUser, PendingUidRequest, UserStep],
      synchronize: true,
    }),
    VerificationModule,
    TelegramModule,
  ],
  controllers: [VerificationController],
})
export class AppModule {}
