import {
  BadRequestException,
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { VerificationService } from './verification.service';

@ApiTags('verification')
@Controller('verify-uid')
export class VerificationController {
  constructor(private readonly verification: VerificationService) {}

  @Get()
  @ApiOperation({ summary: 'Check Bybit UID eligibility' })
  @ApiQuery({
    name: 'uid',
    required: true,
    description: 'Bybit UID (numeric)',
    example: '12345678',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification result',
    schema: {
      example: {
        uid: '12345678',
        status: 'APPROVED',
        alreadyVerified: false,
      },
    },
  })
  async verifyUid(@Query('uid') uid?: string) {
    const normalized = String(uid ?? '').trim();
    if (!normalized) {
      throw new BadRequestException('uid is required');
    }
    if (!/^\d+$/.test(normalized)) {
      throw new BadRequestException('uid must be numeric');
    }

    const result = await this.verification.verify(normalized);
    return { uid: normalized, ...result };
  }
}
