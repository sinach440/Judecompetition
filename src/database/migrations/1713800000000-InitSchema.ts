import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1713800000000 implements MigrationInterface {
  name = 'InitSchema1713800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "verified_users" (
        "id" SERIAL NOT NULL,
        "uid" character varying(32) NOT NULL,
        "telegramId" character varying(32),
        "verified_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_verified_users_uid" UNIQUE ("uid"),
        CONSTRAINT "PK_verified_users_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_verified_users_uid"
      ON "verified_users" ("uid")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pending_uid_requests" (
        "id" SERIAL NOT NULL,
        "telegramId" character varying(32) NOT NULL,
        "asked_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "reminder_sent_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_pending_uid_requests_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_pending_uid_requests_telegram_id"
      ON "pending_uid_requests" ("telegramId")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_steps" (
        "id" SERIAL NOT NULL,
        "telegramId" character varying(32) NOT NULL,
        "step" character varying(32) NOT NULL,
        "step_updated_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "reminder_sent_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_user_steps_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_user_steps_telegram_id"
      ON "user_steps" ("telegramId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_user_steps_telegram_id"');
    await queryRunner.query('DROP TABLE IF EXISTS "user_steps"');

    await queryRunner.query('DROP INDEX IF EXISTS "IDX_pending_uid_requests_telegram_id"');
    await queryRunner.query('DROP TABLE IF EXISTS "pending_uid_requests"');

    await queryRunner.query('DROP INDEX IF EXISTS "IDX_verified_users_uid"');
    await queryRunner.query('DROP TABLE IF EXISTS "verified_users"');
  }
}
