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
import { BybitService } from './bybit.service';

@ApiTags('bybit')
@Controller('bybit')
export class BybitController {
  constructor(private readonly bybit: BybitService) {}

  @Get('affiliate/aff-user-list')
  @ApiOperation({ summary: 'Proxy Bybit GET /v5/affiliate/aff-user-list' })
  @ApiQuery({ name: 'size', required: false, example: 100 })
  @ApiQuery({ name: 'needDeposit', required: false, example: true })
  @ApiQuery({ name: 'cursor', required: false, example: 'abc123cursor' })
  @ApiResponse({
    status: 200,
    description: 'Bybit affiliate user list response',
  })
  async getAffiliateUserList(
    @Query('size') size?: string,
    @Query('needDeposit') needDeposit?: string,
    @Query('cursor') cursor?: string,
  ) {
    const parsedSize = size ? Number(size) : 100;
    if (!Number.isFinite(parsedSize) || parsedSize <= 0) {
      throw new BadRequestException('size must be a positive number');
    }

    const parsedNeedDeposit =
      typeof needDeposit === 'string'
        ? needDeposit.toLowerCase() === 'true'
        : true;

    const result = await this.bybit.getAffiliateUserList({
      size: parsedSize,
      needDeposit: parsedNeedDeposit,
      cursor: cursor?.trim() || undefined,
    });

    return result;
  }
}
