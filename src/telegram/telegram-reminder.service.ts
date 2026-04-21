import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { getBotToken } from 'nestjs-telegraf';
import type { Telegraf } from 'telegraf';
import { boldHtml, escapeTelegramHtml } from '../common';
import { UserStepService } from '../storage/user-step.service';
import type { Step } from '../storage/entities/user-step.entity';

@Injectable()
export class TelegramReminderService {
  constructor(
    @Inject(getBotToken()) private readonly bot: Telegraf,
    private readonly config: ConfigService,
    private readonly userStep: UserStepService,
  ) {}

  private getMessageForStep(step: Step): string {
    const affiliateLink = this.config.get<string>('AFFILIATE_LINK')?.trim() ?? '';
    switch (step) {
      case 'start':
        return `${boldHtml('🟢 Continue')}\n\nTap Start on the welcome message to continue.`;
      case 'awaiting_account_choice':
        return (
          `${boldHtml('🟢 To begin')}\n\n` +
          'Do you already have a Bybit account?\n\n' +
          "Tap ✅ Yes or ❌ No on the bot's last message."
        );
      case 'awaiting_uid':
        return (
          `${boldHtml('🟡 BYBIT UID')}\n\n` +
          "You haven't sent your Bybit UID yet.\n\n" +
          'Please Enter your Bybit UID below so we can verify your eligibility for the challenge.'
        );
      case 'after_signup':
        return (
          `${boldHtml('🔵 Account setup')}\n\n` +
          'Finish creating your account, then tap Done on the setup message.\n\n' +
          'After that, send your Bybit UID here.'
        );
      case 'not_registered':
        return (
          `${boldHtml('❌ IF UID IS NOT REGISTERED UNDER OUR LINK')}\n\n` +
          "This usually means the account was not created using the required link, so we're unable to track your performance." +
          (affiliateLink ? `\n\n👉 ${escapeTelegramHtml(affiliateLink)}` : '')
        );
      case 'insufficient_funds':
        return (
          `${boldHtml('🟠 Minimum balance')}\n\n` +
          "We're still unable to complete verification for this UID.\n\n" +
          'Top up if needed, then send your UID again.'
        );
      default:
        return (
          `${boldHtml('🟡 BYBIT UID')}\n\n` +
          'Please Enter your Bybit UID below so we can verify your eligibility for the challenge.'
        );
    }
  }

  private readonly reminderHeader = () => `${boldHtml('🔔 Reminder')}\n\n`;

  /** Every 15 minutes, send step-based reminders to users stuck 24h+ at a step. */
  @Cron('*/15 * * * *')
  async sendDueReminders(): Promise<void> {
    const due = await this.userStep.findDueForReminder();
    for (const row of due) {
      try {
        const message = this.reminderHeader() + this.getMessageForStep(row.step as Step);
        await this.bot.telegram.sendMessage(row.telegramId, message, {
          parse_mode: 'HTML',
        });
        await this.userStep.markReminderSent(row.id);
      } catch (err) {
        console.error('[Reminder] Failed to send to', row.telegramId, err);
        await this.userStep.markReminderSent(row.id).catch(() => {});
      }
    }
  }
}
