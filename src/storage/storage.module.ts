import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PendingUidRequest } from './entities/pending-uid-request.entity';
import { UserInviteLink } from './entities/user-invite-link.entity';
import { UserStep } from './entities/user-step.entity';
import { VerifiedUser } from './entities/verified-user.entity';
import { PendingUidRequestService } from './pending-uid-request.service';
import { UserInviteLinkService } from './user-invite-link.service';
import { UserStepService } from './user-step.service';
import { VerifiedUserService } from './verified-user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VerifiedUser,
      PendingUidRequest,
      UserStep,
      UserInviteLink,
    ]),
  ],
  providers: [
    VerifiedUserService,
    PendingUidRequestService,
    UserStepService,
    UserInviteLinkService,
  ],
  exports: [
    VerifiedUserService,
    PendingUidRequestService,
    UserStepService,
    UserInviteLinkService,
  ],
})
export class StorageModule {}
