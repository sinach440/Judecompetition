import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { StorageModule } from '../storage/storage.module';
import { UserTelegramChatService } from '../storage/user-telegram-chat.service';
import { VerificationModule } from '../verification/verification.module';
import { TelegramReminderService } from './telegram-reminder.service';
import { TelegramUpdate } from './telegram.update';
import { TelegramService } from './telegram.service';
import { TelegramWebhookController } from './telegram-webhook.controller';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule, StorageModule],
      useFactory: (configService: ConfigService, userTelegramChats: UserTelegramChatService) => ({
        token: configService.get<string>('TELEGRAM_BOT_TOKEN') ?? '',
        // Do not auto-launch; main.ts sets up webhook (production) or polling (development)
        launchOptions: false,
        // Explicitly include this module so /start and other handlers are registered
        include: [TelegramModule],
        middlewares: [
          async (ctx, next) => {
            const from = ctx.from?.id;
            const chat = ctx.chat;
            if (
              from != null &&
              chat?.id != null &&
              chat.type === 'private'
            ) {
              try {
                await userTelegramChats.upsertChatId(String(from), String(chat.id));
              } catch (e) {
                console.error('[telegram] failed to persist chat_id', e);
              }
            }
            return next();
          },
        ],
      }),
      inject: [ConfigService, UserTelegramChatService],
    }),
    StorageModule,
    VerificationModule,
  ],
  controllers: [TelegramWebhookController],
  providers: [TelegramUpdate, TelegramService, TelegramReminderService],
})
export class TelegramModule {}
