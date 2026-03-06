import {
  Action,
  Command,
  Ctx,
  Help,
  On,
  Start,
  Update,
} from 'nestjs-telegraf';
import { ConfigService } from '@nestjs/config';
import { Markup } from 'telegraf';
import type { Context } from 'telegraf';
import { VerificationService } from '../verification/verification.service';
import { PendingUidRequestService } from '../storage/pending-uid-request.service';
import { VerifiedUserService } from '../storage/verified-user.service';

const ACTION_ALREADY_BYBIT = 'already_bybit_user';
const ACTION_SIGN_UP_BONUS = 'sign_up_bonus';

@Update()
export class TelegramUpdate {
  constructor(
    private readonly config: ConfigService,
    private readonly verification: VerificationService,
    private readonly verifiedUser: VerifiedUserService,
    private readonly pendingUid: PendingUidRequestService,
  ) {}

  private getAffiliateLink(): string {
    return this.config.get<string>('AFFILIATE_LINK')?.trim() ?? '';
  }

  @Start()
  async start(@Ctx() ctx: Context) {
    try {
      const howToJoin =
        'How to join:\n\n' +
        '1. Sign up on Bybit to start trading.\n' +
        '2. Deposit $100 into your Bybit account.\n' +
        '3. Enter your unique Bybit UID.\n' +
        '4. Receive an invite link to join the VIP group.';

      await ctx.reply(
        howToJoin,
        Markup.inlineKeyboard([
          [Markup.button.callback('Already A Bybit User', ACTION_ALREADY_BYBIT)],
          [Markup.button.callback('Sign Up & Get Bonus', ACTION_SIGN_UP_BONUS)],
        ]),
      );
    } catch (err) {
      console.error('Error in /start:', err);
      try {
        await ctx.reply('Something went wrong. Please try again in a moment.');
      } catch {
        // ignore
      }
    }
  }

  @Action(ACTION_ALREADY_BYBIT)
  async onAlreadyBybitUser(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    const telegramId = ctx.from?.id;
    if (telegramId) await this.pendingUid.createOrRefresh(String(telegramId));
    await ctx.reply('Please input your Bybit UID.');
  }

  @Action(ACTION_SIGN_UP_BONUS)
  async onSignUpBonus(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    await this.sendSignUpBonus(ctx);
  }

  @Command('signup')
  async onSignUpCommand(@Ctx() ctx: Context) {
    await this.sendSignUpBonus(ctx);
  }

  @Command('bybituser')
  async onBybitUserCommand(@Ctx() ctx: Context) {
    const telegramId = ctx.from?.id;
    if (telegramId) await this.pendingUid.createOrRefresh(String(telegramId));
    await ctx.reply('Please input your Bybit UID.');
  }

  private async sendSignUpBonus(ctx: Context) {
    const link = this.getAffiliateLink();
    const text =
      'Sign up with our referral link to get your bonus and join the community:\n\n' +
      (link ? `${link}\n\n` : '') +
      'Your account must have net assets of at least $100 to qualify for the VIP group.';
    await ctx.reply(
      text,
      link
        ? Markup.inlineKeyboard([[Markup.button.url('Sign up and get bonus', link)]])
        : undefined,
    );
  }

  @Help()
  async help(@Ctx() ctx: Context) {
    const link = this.getAffiliateLink();
    const text =
      'Need help? Send your Bybit UID to check if you qualify for the VIP group. Your account must be under our affiliate link with net assets of at least $100.' +
      (link ? `\n\nReferral link: ${link}` : '');
    await ctx.reply(text);
  }

  @On('text')
  async onText(@Ctx() ctx: Context) {
    const chatId = ctx.chat?.id;
    if (!chatId) return;

    const uid = ctx.message && 'text' in ctx.message ? ctx.message.text?.trim() : undefined;

    // Don't treat commands as UIDs
    if (!uid || uid.startsWith('/')) {
      return;
    }

    if (isNaN(Number(uid))) {
      await ctx.reply('Please send a valid UID.');
      return;
    }

    // User is submitting a UID — clear any pending 24h reminder
    await this.pendingUid.clear(String(ctx.from?.id ?? ''));

    let result;
    try {
      result = await this.verification.verify(uid);
    } catch (err) {
      console.error('Verification error for UID', uid, err);
      await ctx.reply(
        "We couldn't verify your UID right now. Please try again in a few moments.",
      );
      return;
    }

    switch (result.status) {
      case 'NOT_REGISTERED': {
        const link = this.getAffiliateLink();
        await ctx.reply(
          `The UID you sent is not associated with me.\n` +
            (link ? `Please register using my referral link:\n\n${link}\n\n` : 'Please register using our referral link.\n\n') +
            `The account must have net assets of at least $100.00 before you can use the BOT to join the group.`,
        );
        return;
      }

      case 'INSUFFICIENT_FUNDS':
        await ctx.reply(
          `You don't meet the requirements to join the group.\n\n` +
            `Your account must have net assets of at least $100.00 to use the BOT for joining.`,
        );
        return;

      case 'APPROVED':
        if (result.alreadyVerified) {
          await ctx.reply(
            "You're already verified. Use the VIP link we sent you earlier.",
          );
          return;
        }
        await ctx.reply(
          `Congratulations! You meet the requirements to join the group.\n\nClick on the button below to join the VIP group.`,
          Markup.inlineKeyboard([
            [
              Markup.button.url(
                'Join VIP Group',
                this.config.get<string>('VIP_GROUP_LINK') ?? '',
              ),
            ],
          ]),
        );
        await this.verifiedUser.markVerified(uid, String(ctx.from?.id ?? ''));
        return;
    }
  }
}
