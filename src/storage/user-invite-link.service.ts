import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserInviteLink } from './entities/user-invite-link.entity';

@Injectable()
export class UserInviteLinkService {
  constructor(
    @InjectRepository(UserInviteLink)
    private readonly repo: Repository<UserInviteLink>,
  ) {}

  async getLastInviteLink(telegramId: string): Promise<string | null> {
    const row = await this.repo.findOne({ where: { telegramId } });
    return row?.inviteLink ?? null;
  }

  async setLastInviteLink(telegramId: string, inviteLink: string): Promise<UserInviteLink> {
    const now = new Date();
    let row = await this.repo.findOne({ where: { telegramId } });
    if (!row) {
      row = this.repo.create({ telegramId, inviteLink, issuedAt: now });
      return this.repo.save(row);
    }
    row.inviteLink = inviteLink;
    row.issuedAt = now;
    return this.repo.save(row);
  }
}
