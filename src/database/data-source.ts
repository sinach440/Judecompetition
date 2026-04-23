import 'dotenv/config';
import { DataSource } from 'typeorm';
import { PendingUidRequest } from '../storage/entities/pending-uid-request.entity';
import { UserStep } from '../storage/entities/user-step.entity';
import { VerifiedUser } from '../storage/entities/verified-user.entity';

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

export default new DataSource({
  type: 'postgres',
  url: databaseUrl,
  entities: [VerifiedUser, PendingUidRequest, UserStep],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
