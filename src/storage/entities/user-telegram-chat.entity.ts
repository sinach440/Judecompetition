import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Maps Telegram user id → private chat id for outbound DMs (set on every update). */
@Entity('user_telegram_chats')
export class UserTelegramChat {
  @PrimaryColumn({ type: 'varchar', length: 32, name: 'telegram_id' })
  telegramId: string;

  @Column({ type: 'varchar', length: 32, name: 'chat_id' })
  chatId: string;
}
