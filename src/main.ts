import * as fs from 'fs';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { getBotToken } from 'nestjs-telegraf';
import type { Telegraf } from 'telegraf';

async function bootstrap() {
  // Ensure data directory exists so TypeORM sql.js can save the DB file (e.g. in Docker / fresh deploy)
  const dataDir = path.join(process.cwd(), 'data');
  fs.mkdirSync(dataDir, { recursive: true });

  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const nodeEnv = config.get<string>('NODE_ENV', 'development');
  const isProduction = nodeEnv === 'production';

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Bybit Affiliate Bot API')
    .setDescription('Webhook and health endpoints for the Telegram challenge bot')
    .setVersion('1.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  const bot = app.get<Telegraf>(getBotToken());

  // Global error handler (same as bot.catch in standalone Telegraf)
  bot.catch((err, ctx) => {
    console.error(`Bot error for ${ctx.updateType}:`, err);
  });

  // Set bot menu (commands shown when user taps / or menu button)
  await bot.telegram.setMyCommands([
    { command: 'start', description: 'Start / How to join' },
    { command: 'signup', description: 'Sign up and get bonus' },
    { command: 'bybituser', description: 'Already a Bybit user' },
  ]);

  if (isProduction) {
    const serverUrl = config.get<string>('SERVER_URL');
    if (!serverUrl) {
      throw new Error('SERVER_URL is required in production mode');
    }

    const webhookPath = config.get<string>('WEBHOOK_PATH', '/telegram-webhook');
    const webhookUrl = `${serverUrl.replace(/\/$/, '')}${webhookPath}`;
    console.log(`Webhook path: ${webhookPath} (handled by TelegramWebhookController)`);

    await app.listen(process.env.PORT ?? 3000);

    await bot.telegram.setWebhook(webhookUrl);
    console.log(`✅ Webhook set successfully to: ${webhookUrl}`);
  } else {
    await bot.telegram.deleteWebhook();
    console.log('Deleted webhook for development');
    try {
      console.log('Starting bot in polling mode...');
      await bot.launch({ dropPendingUpdates: true }).then(() => {
        console.log('🤖 Bot started in polling mode');
      }).catch((err) => {
        console.error('❌ Failed to start bot (check TELEGRAM_BOT_TOKEN and network):', err);
        throw err;
      });
      console.log('🤖 Bot started in polling mode');
    } catch (err) {
      console.error('❌ Failed to start bot (check TELEGRAM_BOT_TOKEN and network):', err);
      throw err;
    }
    await app.listen(process.env.PORT ?? 3000);
  }
}
bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
