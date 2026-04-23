import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserTelegramChat } from './entities/user-telegram-chat.entity';

@Injectable()
export class UserTelegramChatService {
  constructor(
    @InjectRepository(UserTelegramChat)
    private readonly repo: Repository<UserTelegramChat>,
  ) {}

  /** Store latest private chat id for this Telegram user (for /sendMessage). */
  async upsertChatId(telegramId: string, chatId: string): Promise<void> {
    const id = String(telegramId);
    const cid = String(chatId);
    await this.repo.upsert({ telegramId: id, chatId: cid }, { conflictPaths: ['telegramId'] });
  }
}
