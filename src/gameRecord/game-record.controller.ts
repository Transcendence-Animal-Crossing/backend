import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
  async getRankedUsers() {
    const ranks = await this.gameRecordService.getRanking();
    return ranks;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getRecordById(id: number, isRank: boolean) {
    return await this.gameRecordService.findRecord(id, isRank);
  }
}
