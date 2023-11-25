import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GameHistoryService } from './game-history.service';
import { CreateGameDto } from './dto/create-game.dto';
import { GameRecordService } from 'src/gameRecord/game-record.service';
import { GameType } from './const/game.type';

@Controller('games')
@UseGuards(JwtAuthGuard)
export class GameController {
  constructor(
    private readonly gameHistoryService: GameHistoryService,
    private readonly gameRecordService: GameRecordService,
  ) {}
  @Get('rank')
  async getAllRankGames(
    @Query('id') id: number,
    @Query('offset') offset: number,
  ) {
    return this.gameHistoryService.getAllGamesById(id, GameType.RANK, offset);
  }

  @Get('general')
  async getAllGeneralGames(
    @Query('id') id: number,
    @Query('offset') offset: number,
  ) {
    return this.gameHistoryService.getAllGamesById(id, GameType.NORMAL, offset);
  }

  @Post('game')
  @HttpCode(HttpStatus.CREATED)
  async createGame(@Body() createGameDto: CreateGameDto) {
    await this.gameHistoryService.createGame(createGameDto);
    await this.gameRecordService.updateGameRecord(
      createGameDto.winnerId,
      createGameDto.loserId,
      createGameDto.type,
    );
  }
  //삭제 예정
  @Get('all')
  async getGameAll() {
    return this.gameHistoryService.findAll();
  }
  //삭제 예정
  @Post(':id')
  async getGameById(@Param('id') id: number) {
    return this.gameHistoryService.findByUserId(id);
  }
}
