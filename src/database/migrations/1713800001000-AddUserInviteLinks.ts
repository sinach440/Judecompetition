import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserInviteLinks1713800001000 implements MigrationInterface {
  name = 'AddUserInviteLinks1713800001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_invite_links" (
        "id" SERIAL NOT NULL,
        "telegramId" character varying(32) NOT NULL,
        "invite_link" text NOT NULL,
        "issued_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT "PK_user_invite_links_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_user_invite_links_telegram_id"
      ON "user_invite_links" ("telegramId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_user_invite_links_telegram_id"');
    await queryRunner.query('DROP TABLE IF EXISTS "user_invite_links"');
  }
}
