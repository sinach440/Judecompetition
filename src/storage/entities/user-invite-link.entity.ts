import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user_invite_links')
export class UserInviteLink {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 32 })
  @Index('IDX_user_invite_links_telegram_id', { unique: true })
  telegramId: string;

  @Column({ type: 'text', name: 'invite_link' })
  inviteLink: string;

  @Column({ type: 'timestamptz', name: 'issued_at' })
  issuedAt: Date;
}
