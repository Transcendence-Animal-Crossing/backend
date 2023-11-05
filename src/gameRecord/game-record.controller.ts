import {
  Controller,
  Get,
  HttpCode,
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
    const ranks = await this.gameRecordService.getRanking(offset);
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
