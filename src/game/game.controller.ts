import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GameService } from './game.service';
import { CreateGameDto } from './dto/create-game.dto';
import { GameRecordService } from 'src/gameRecord/game-record.service';

@Controller('games')
@UseGuards(JwtAuthGuard)
export class GameController {
  constructor(
    private readonly gameService: GameService,
    private readonly gameRecordService: GameRecordService,
  ) {}
  @Get('rank')
  async getAllRankGames(
    @Query('id') id: number,
    @Query('offset') offset: number,
  ) {
    return this.gameService.getAllGamesById(id, true, offset);
  }

  @Get('general')
  async getAllGeneralGames(
    @Query('id') id: number,
    @Query('offset') offset: number,
  ) {
    return this.gameService.getAllGamesById(id, false, offset);
  }

  @Post('game')
  @HttpCode(HttpStatus.CREATED)
  async createGame(@Body() createGameDto: CreateGameDto) {
    await this.gameService.createGame(createGameDto);
    await this.gameRecordService.updateGameRecord(
      createGameDto.winnerId,
      createGameDto.loserId,
      createGameDto.isRank,
    );
  }
}
