# Bybit Affiliate Telegram Bot

A Telegram bot that verifies users by Bybit UID (affiliate + balance) and sends a one-time VIP group invite. Built with NestJS, Telegraf, and TypeORM (PostgreSQL).

---

## What the bot does

- **Start flow:** Users see “How to join” and can choose “Already A Bybit User” or “Sign Up & Get Bonus”.
- **UID check:** Users send their Bybit UID; the bot checks via Bybit API that the account is under your affiliate and has at least $100.
- **VIP group link:** On success, the bot sends the VIP group link once. If the UID was already used by another Telegram user, it asks for a different UID.
- **Reminders:** If a user stops at any step (e.g. didn’t choose an option, didn’t send UID, or failed verification), the bot sends a step-specific reminder after 24 hours.

---

## Prerequisites

- **Node.js** 18+ (or 22+)
- **pnpm** (or npm/yarn)
- A **Telegram bot** ([@BotFather](https://t.me/BotFather))
- **Bybit affiliate API** credentials (API key + secret) and your **affiliate link**
- For **production:** a public HTTPS URL for the webhook

---

## Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd bybit-affiliate
pnpm install
```

### 2. Environment variables

Copy the example env and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `development` (polling) or `production` (webhook) |
| `SERVER_URL` | Public base URL in production (e.g. `https://your-app.com`) |
| `WEBHOOK_PATH` | Webhook path (default `/telegram-webhook`) |
| `DATABASE_URL` | PostgreSQL connection URL (required) |
| `TELEGRAM_BOT_TOKEN` | Token from BotFather |
| `BYBIT_API_KEY` | Bybit API key (affiliate) |
| `BYBIT_SECRET` | Bybit API secret |
| `BYBIT_BASE_URL` | `https://api.bybit.com` (or testnet if needed) |
| `AFFILIATE_LINK` | Your Bybit referral/affiliate link |
| `VIP_GROUP_LINK` | Telegram invite link for the VIP group |

### 3. Database

The app uses PostgreSQL via `DATABASE_URL` and connects with TypeORM. Ensure your database is reachable from your runtime environment.

---

## Running the bot

### Development (polling)

- Set `NODE_ENV=development` in `.env`.
- The bot uses long polling; no public URL needed.

```bash
pnpm run start
# or watch mode
pnpm run start:dev
```

### Production (webhook)

- Set `NODE_ENV=production` and `SERVER_URL` to your public HTTPS base (e.g. `https://your-domain.com`).
- Expose the app (e.g. port 3000) and ensure `SERVER_URL` + `WEBHOOK_PATH` is reachable by Telegram.

```bash
pnpm run build
pnpm run start:prod
```

Telegram will send updates to `https://<SERVER_URL><WEBHOOK_PATH>` (e.g. `https://your-domain.com/telegram-webhook`).

---

## How to use the bot (user flow)

1. **Start:** User sends `/start` and sees the “How to join” steps and two buttons.
2. **Already a Bybit user:** User taps “Already A Bybit User” (or sends `/bybituser`). Bot asks for their Bybit UID.
3. **Sign up:** User taps “Sign Up & Get Bonus” (or `/signup`). Bot shows the affiliate link and explains the $100 requirement.
4. **Send UID:** User sends their numeric Bybit UID. The bot:
   - Checks with Bybit that the UID is under your affiliate and has ≥ $100.
   - If **not registered** under your affiliate → asks them to sign up with your link.
   - If **insufficient funds** → asks them to top up to at least $100.
   - If **approved** → sends the VIP group link once. If that UID was already used by someone else → asks for a different UID.
5. **Reminders:** If the user doesn’t complete the next step within 24 hours, the bot sends a “Reminder” message (with a bell) tailored to the step they stopped at (e.g. “choose an option”, “send your UID”, “sign up with our link”, “top up to $100”).

---

## Commands

- `/start` — Show how to join and main options.
- `/signup` — Show the affiliate sign-up link and $100 requirement.
- `/bybituser` — Ask for the user’s Bybit UID.
- `/help` — Short help and referral link.

---

## Project structure (overview)

- `src/main.ts` — Bootstrap, webhook vs polling.
- `src/app.module.ts` — Config, TypeORM (PostgreSQL), Schedule, Telegram module.
- `src/telegram/` — Bot handlers (`telegram.update.ts`), webhook controller, step-based reminder cron.
- `src/verification/` — Bybit UID verification (affiliate + balance).
- `src/storage/` — Verified users (one-time VIP link), user steps (for reminders), pending UID requests (legacy).
- `src/bybit/` — Bybit API client (HMAC-signed requests).

---

## License

MIT (or as in the project).
