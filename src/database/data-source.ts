import 'dotenv/config';
import { DataSource } from 'typeorm';
import { PendingUidRequest } from '../storage/entities/pending-uid-request.entity';
import { UserInviteLink } from '../storage/entities/user-invite-link.entity';
import { UserStep } from '../storage/entities/user-step.entity';
import { UserTelegramChat } from '../storage/entities/user-telegram-chat.entity';
import { VerifiedUser } from '../storage/entities/verified-user.entity';

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

export default new DataSource({
  type: 'postgres',
  url: databaseUrl,
  entities: [VerifiedUser, PendingUidRequest, UserStep, UserInviteLink, UserTelegramChat],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
