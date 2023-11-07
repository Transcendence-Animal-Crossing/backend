import {
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GameRecordService } from './game-record.service';

@Controller('record')
@UseGuards(JwtAuthGuard)
export class GameRecordController {
  constructor(private readonly gameRecordService: GameRecordService) {}

  @Get('rank')
  @HttpCode(HttpStatus.OK)
  async getRankedUsers(@Query('offset') offset: number) {
    if (offset < 0) {
      throw new HttpException('offset은 양수만 가능', HttpStatus.BAD_REQUEST);
    }
    const ranks = await this.gameRecordService.getRanking(offset);
    if (ranks.length == 0)
      throw new HttpException(
        '더이상 돌려줄 데이터 없음',
        HttpStatus.BAD_REQUEST,
      );
    return ranks;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getRecordById(
    @Query('id') id: number,
    @Query('isRank') isRank: boolean,
  ) {
    const record = await this.gameRecordService.findRecord(id, isRank);
    return record;
  }
}
