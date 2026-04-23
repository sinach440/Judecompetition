import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL')?.trim();
        if (!databaseUrl) {
          throw new Error('DATABASE_URL is required');
        }

        return {
          type: 'postgres' as const,
          url: databaseUrl,
          entities: [VerifiedUser, PendingUidRequest, UserStep],
          migrations: ['dist/database/migrations/*.js'],
          migrationsRun: true,
          synchronize: false,
        };
      },
    }),
    VerificationModule,
    TelegramModule,
  ],
  controllers: [VerificationController],
})
export class AppModule {}
