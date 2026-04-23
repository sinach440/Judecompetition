import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserTelegramChats1713800002000 implements MigrationInterface {
  name = 'AddUserTelegramChats1713800002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_telegram_chats" (
        "telegram_id" character varying(32) NOT NULL,
        "chat_id" character varying(32) NOT NULL,
        CONSTRAINT "PK_user_telegram_chats_telegram_id" PRIMARY KEY ("telegram_id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "user_telegram_chats"');
  }
}
