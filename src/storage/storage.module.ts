import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PendingUidRequest } from './entities/pending-uid-request.entity';
import { UserInviteLink } from './entities/user-invite-link.entity';
import { UserStep } from './entities/user-step.entity';
import { UserTelegramChat } from './entities/user-telegram-chat.entity';
import { VerifiedUser } from './entities/verified-user.entity';
import { PendingUidRequestService } from './pending-uid-request.service';
import { UserInviteLinkService } from './user-invite-link.service';
import { UserStepService } from './user-step.service';
import { UserTelegramChatService } from './user-telegram-chat.service';
import { VerifiedUserService } from './verified-user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VerifiedUser,
      PendingUidRequest,
      UserStep,
      UserInviteLink,
      UserTelegramChat,
    ]),
  ],
  providers: [
    VerifiedUserService,
    PendingUidRequestService,
    UserStepService,
    UserInviteLinkService,
    UserTelegramChatService,
  ],
  exports: [
    VerifiedUserService,
    PendingUidRequestService,
    UserStepService,
    UserInviteLinkService,
    UserTelegramChatService,
  ],
})
export class StorageModule {}
