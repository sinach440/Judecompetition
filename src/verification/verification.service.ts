import { Injectable } from '@nestjs/common';
import { BybitService } from '../bybit/bybit.service';
import { VerifiedUserService } from '../storage/verified-user.service';

export type VerificationStatus =
  | 'NOT_REGISTERED'
  | 'INSUFFICIENT_FUNDS'
  | 'APPROVED';

export interface VerificationResult {
  status: VerificationStatus;
  /** True when UID was already in storage – VIP group link must not be sent again. */
  alreadyVerified?: boolean;
}

/**
 * Eligibility uses Bybit totalWalletBalance tier:
 * "1" = <100 USDT, "2" = [100, 250), "3" = [250, 500), "4" = >= 500.
 * We require tier >= 2 (i.e. at least 100 USDT wallet balance).
 */
@Injectable()
export class VerificationService {
  constructor(
    private bybit: BybitService,
    private verifiedUser: VerifiedUserService,
  ) {}

  async verify(uid: string): Promise<VerificationResult> {
    const normalized = String(uid).trim();

    if (await this.verifiedUser.isVerified(normalized)) {
      return { status: 'APPROVED', alreadyVerified: true };
    }

    // Step 1: must be under this affiliate first.
    const isUnderAffiliate = await this.bybit.isUserUnderAffiliate(normalized);
    if (!isUnderAffiliate) {
      return { status: 'NOT_REGISTERED' };
    }

    // Step 2: if under affiliate, enforce minimum wallet tier (>= 2, i.e. >= $100).
    const info = await this.bybit.getAffiliateCustomerInfo(normalized);
    if (!info) {
      // Defensive fallback: if profile lookup fails after affiliate check, treat as not registered for now.
      return { status: 'NOT_REGISTERED' };
    }

    if (!this.bybit.hasMinWalletBalance(info, 2)) {
      return { status: 'INSUFFICIENT_FUNDS' };
    }

    return { status: 'APPROVED', alreadyVerified: false };
  }
}
