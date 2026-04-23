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
import { boldHtml, escapeTelegramHtml } from '../common';
import { VerificationService } from '../verification/verification.service';
import { UserStepService } from '../storage/user-step.service';
import { UserInviteLinkService } from '../storage/user-invite-link.service';
import { VerifiedUserService } from '../storage/verified-user.service';

const ACTION_BEGIN = 'challenge_begin';
const ACTION_ALREADY_BYBIT = 'already_bybit_user';
const ACTION_SIGN_UP_BONUS = 'sign_up_bonus';
const ACTION_SIGNUP_DONE = 'signup_account_done';
const ACTION_GET_GROUP_INVITE = 'get_group_invite';

@Update()
export class TelegramUpdate {
  constructor(
    private readonly config: ConfigService,
    private readonly verification: VerificationService,
    private readonly verifiedUser: VerifiedUserService,
    private readonly userStep: UserStepService,
    private readonly userInviteLink: UserInviteLinkService,
  ) {}

  private getAffiliateLink(): string {
    return this.config.get<string>('AFFILIATE_LINK')?.trim() ?? '';
  }

  /** Google Form URL from doc (overridable via CHALLENGE_FORM_LINK). */
  private getChallengeFormLink(): string {
    const raw = this.config.get<string>('CHALLENGE_FORM_LINK')?.trim();
    return raw || 'https://forms.gle/5cMTKQf5f8c6sY2TA';
  }

  /** Transfer guide URL from doc (overridable via TRANSFER_GUIDE_URL). */
  private getTransferGuideUrl(): string {
    const raw = this.config.get<string>('TRANSFER_GUIDE_URL')?.trim();
    return raw || 'https://drive.google.com/file/d/1zdoYEavv1TYPyCDFJjefKPzOCYndIlGq/view?usp=sharing';
  }

  /**
   * Private VIP group chat id where per-user invite links are generated.
   * Supports numeric ids (e.g. -100...) and string usernames.
   */
  private getVipGroupChatId(): string | number | undefined {
    const raw = this.config.get<string>('VIP_GROUP_CHAT_ID')?.trim();
    if (!raw) return undefined;
    if (/^-?\d+$/.test(raw)) return Number(raw);
    return raw;
  }

  private htmlReply(
    ctx: Context,
    text: string,
    extra?: NonNullable<Parameters<Context['reply']>[1]>,
  ) {
    return ctx.reply(text, { parse_mode: 'HTML', ...extra });
  }

  @Start()
  async start(@Ctx() ctx: Context) {
    try {
      const telegramId = ctx.from?.id;
      if (telegramId) await this.userStep.setStep(String(telegramId), 'start');

      const welcomeMessage =
        `${boldHtml('🟢 WELCOME TO THE 30-DAY TRADING CHALLENGE')}\n\n` +
        'Win an iPhone 17 🏆\n\n' +
        "I'll guide you through how to join.\n\n" +
        `${boldHtml('🎁 Prizes:')}\n\n` +
        '🥇 1st — iPhone 17\n' +
        '🥈 2nd — $200\n' +
        '🥉 3rd — $100\n\n' +
        '👀 Top traders will also be considered for CopyMe (early access), a platform where strong trading performance can be scaled beyond just your personal account.';

      await this.htmlReply(
        ctx,
        welcomeMessage,
        Markup.inlineKeyboard([[Markup.button.callback('Start', ACTION_BEGIN)]]),
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

  @Action(ACTION_BEGIN)
  async onBegin(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    const telegramId = ctx.from?.id;
    if (telegramId) await this.userStep.setStep(String(telegramId), 'awaiting_account_choice');
    await this.htmlReply(
      ctx,
      `${boldHtml('🟢 To begin:')}\n\n` + 'Do you already have a Bybit account?',
      Markup.inlineKeyboard([
        [Markup.button.callback('✅ Yes', ACTION_ALREADY_BYBIT)],
        [Markup.button.callback('❌ No', ACTION_SIGN_UP_BONUS)],
      ]),
    );
  }

  @Action(ACTION_ALREADY_BYBIT)
  async onAlreadyBybitUser(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    const telegramId = ctx.from?.id;
    if (telegramId) await this.userStep.setStep(String(telegramId), 'awaiting_uid');
    await this.htmlReply(
      ctx,
      `${boldHtml('🟡 BYBIT UID')}\n\n` +
        'Please Enter your Bybit UID below so we can verify your eligibility for the challenge.',
    );
  }

  @Action(ACTION_SIGN_UP_BONUS)
  async onSignUpBonus(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    const telegramId = ctx.from?.id;
    if (telegramId) await this.userStep.setStep(String(telegramId), 'after_signup');
    await this.sendSignUpBonus(ctx);
  }

  @Action(ACTION_SIGNUP_DONE)
  async onSignUpDone(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    const telegramId = ctx.from?.id;
    if (telegramId) await this.userStep.setStep(String(telegramId), 'awaiting_uid');
    await this.htmlReply(
      ctx,
      `${boldHtml('🟡 BYBIT UID')}\n\n` +
        'Please Enter your Bybit UID below so we can verify your eligibility for the challenge.',
    );
  }

  @Action(ACTION_GET_GROUP_INVITE)
  async onGetGroupInvite(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    const chatId = this.getVipGroupChatId();
    const userId = ctx.from?.id;

    if (!chatId || !userId) {
      await this.htmlReply(
        ctx,
        `${boldHtml('⚠️ Invite unavailable')}\n\n` +
          'The private group invite is not configured yet.\n\n' +
          'Please contact support.',
      );
      return;
    }

    try {
      const telegramId = String(userId);
      const lastInvite = await this.userInviteLink.getLastInviteLink(telegramId);
      if (lastInvite) {
        try {
          await ctx.telegram.revokeChatInviteLink(chatId, lastInvite);
        } catch (revokeErr) {
          // Best effort cleanup: old links may already be used/revoked.
          console.warn(
            `[telegram] failed to revoke previous invite link for user ${telegramId}`,
            revokeErr,
          );
        }
      }

      const invite = await ctx.telegram.createChatInviteLink(chatId, {
        member_limit: 1,
        name: `uid:${userId}`,
      });
      await this.userInviteLink.setLastInviteLink(telegramId, invite.invite_link);

      await this.htmlReply(
        ctx,
        `${boldHtml('🔐 Your private invite link')}\n\n` +
          'This link is for one join only. Open it on the device you use for Telegram, and do not share it.\n\n' +
          `${escapeTelegramHtml(invite.invite_link)}`,
      );
    } catch (err) {
      console.error('Failed to generate private group invite link', err);
      await this.htmlReply(
        ctx,
        `${boldHtml('⚠️ Invite unavailable')}\n\n` +
          "We couldn't generate your private invite link right now.\n\n" +
          'Please try again in a moment.',
      );
    }
  }

  @Command('signup')
  async onSignUpCommand(@Ctx() ctx: Context) {
    const telegramId = ctx.from?.id;
    if (telegramId) await this.userStep.setStep(String(telegramId), 'after_signup');
    await this.sendSignUpBonus(ctx);
  }

  @Command('bybituser')
  async onBybitUserCommand(@Ctx() ctx: Context) {
    const telegramId = ctx.from?.id;
    if (telegramId) await this.userStep.setStep(String(telegramId), 'awaiting_uid');
    await this.htmlReply(
      ctx,
      `${boldHtml('🟡 BYBIT UID')}\n\n` +
        'Please Enter your Bybit UID below so we can verify your eligibility for the challenge.',
    );
  }

  private async sendSignUpBonus(ctx: Context) {
    const link = this.getAffiliateLink();
    const linkBlock = link
      ? `👉 ${escapeTelegramHtml(link)}\n\n`
      : '(Configure AFFILIATE_LINK for your sign-up URL.)\n\n';
    const text =
      `${boldHtml('🔵 Account setup')}\n\n` +
      "Let's get you set up.\n\n" +
      'Create your Bybit account using the link below:\n\n' +
      linkBlock +
      "Once you're done, come back here and send your Bybit UID to continue.\n\n" +
      'Tap Done below when your account is ready.';
    await this.htmlReply(
      ctx,
      text,
      Markup.inlineKeyboard([[Markup.button.callback('Done', ACTION_SIGNUP_DONE)]]),
    );
  }

  @Help()
  async help(@Ctx() ctx: Context) {
    const link = this.getAffiliateLink();
    const text =
      `${boldHtml('📘 Help')}\n\n` +
      'Use /start to see how to join the 30-Day Trading Challenge.\n\n' +
      'Send your Bybit UID in this chat when the bot asks for it.' +
      (link ? `\n\n${boldHtml('Official link')}\n\n👉 ${escapeTelegramHtml(link)}` : '');
    await this.htmlReply(ctx, text);
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
      await this.htmlReply(
        ctx,
        `${boldHtml('⚠️ Invalid UID')}\n\n` +
          'Please send a valid Bybit UID.\n\n' +
          'Your UID should be numbers only.',
      );
      return;
    }

    console.log(
      `[telegram] UID received from user ${ctx.from?.id ?? 'unknown'} in chat ${chatId}: ${uid}`,
    );

    await this.htmlReply(
      ctx,
      `${boldHtml('🟢 PROCESSING...')}\n\n` +
        "We're checking your UID to confirm it was registered through the official link.\n\n" +
        'This is required so your trades can be tracked on the leaderboard.\n\n' +
        'Please wait a moment…',
    );

    let result;
    try {
      result = await this.verification.verify(uid);
      console.log(
        `[telegram] verification status for UID ${uid}: ${result.status}` +
          (result.status === 'APPROVED' ? ` (alreadyVerified=${result.alreadyVerified})` : ''),
      );
    } catch (err) {
      console.error('Verification error for UID', uid, err);
      await this.htmlReply(
        ctx,
        `${boldHtml('⚠️ Verification unavailable')}\n\n` +
          "We couldn't verify your UID right now.\n\n" +
          'Please try again in a few moments.',
      );
      return;
    }

    switch (result.status) {
      case 'NOT_REGISTERED': {
        const telegramId = ctx.from?.id;
        if (telegramId) await this.userStep.setStep(String(telegramId), 'not_registered');
        const link = this.getAffiliateLink();
        const transferGuide = this.getTransferGuideUrl();
        const linkLine = link ? `👉 ${escapeTelegramHtml(link)}\n\n` : '';
        const guideLine = transferGuide
          ? `👉 ${escapeTelegramHtml(transferGuide)}\n\n`
          : '';
        const body =
          `${boldHtml('❌ THIS UID IS NOT ELIGIBLE FOR THE CHALLENGE.')}\n\n` +
          "Your account was not created using the required link, so we're unable to track your performance.\n\n" +
          `${boldHtml('You still have two options:')}\n\n` +
          `${boldHtml("Option 1 (If You Don't Have A Bybit Account)")}\n\n` +
          'Create a new Bybit account using the official link:\n\n' +
          linkLine +
          'Then come back and submit your new UID.\n\n' +
          `${boldHtml('Option 2 (If You Have An Already Existing Account)')}\n\n` +
          'If you already have funds or history on your current account, you can transfer it to a new account.\n\n' +
          `${boldHtml('Watch this guide:')}\n\n` +
          guideLine +
          'Once done, send your new UID for verification.';
        await this.htmlReply(
          ctx,
          body,
          Markup.inlineKeyboard([
            [Markup.button.callback('Done', ACTION_SIGNUP_DONE)],
          ]),
        );
        return;
      }

      case 'INSUFFICIENT_FUNDS': {
        const telegramId = ctx.from?.id;
        if (telegramId) await this.userStep.setStep(String(telegramId), 'insufficient_funds');
        await this.htmlReply(
          ctx,
          `${boldHtml('🟠 Minimum balance')}\n\n` +
            'Your account is under our link, but it does not yet meet the minimum balance required for challenge verification.\n\n' +
            'Top up to at least $100 in net wallet balance.\n\n' +
            'Then send your UID again here.',
        );
        return;
      }

      case 'APPROVED':
        if (result.alreadyVerified) {
          await this.htmlReply(
            ctx,
            `${boldHtml('⚠️ UID already in use')}\n\n` +
              'This UID is already linked to another Telegram user.\n\n' +
              'Please send a different UID that belongs to you.',
          );
          return;
        }
        const telegramIdApproved = ctx.from?.id;
        if (telegramIdApproved) await this.userStep.setStep(String(telegramIdApproved), 'verified');
        const formLink = this.getChallengeFormLink();
        const approvedText =
          `${boldHtml("🟢 YOU'RE IN!")}\n\n` +
          "Your UID has been verified and you're now eligible for the challenge.\n\n" +
          `${boldHtml('Next steps:')}\n\n` +
          `${boldHtml('Fill the form below')}\n\n` +
          '👇👇\n\n' +
          `${escapeTelegramHtml(formLink)}\n\n` +
          // `${boldHtml('Join the private challenge group:')}\n\n` +
          `${boldHtml('TAP THE BUTTON BELOW. 👇')}`;
        const approvedExtra = Markup.inlineKeyboard([
          [Markup.button.callback('Get private group invite', ACTION_GET_GROUP_INVITE)],
        ]);
        await this.htmlReply(ctx, approvedText, approvedExtra);
        await this.verifiedUser.markVerified(uid, String(ctx.from?.id ?? ''));
        return;

      default:
        console.error(
          `[telegram] Unexpected verification status for UID ${uid}: ${String(result.status)}`,
          result,
        );
        await this.htmlReply(
          ctx,
          `${boldHtml('⚠️ Verification issue')}\n\n` +
            "We received an unexpected verification result.\n\n" +
            'Please try again in a moment.',
        );
        return;
    }
  }
}
