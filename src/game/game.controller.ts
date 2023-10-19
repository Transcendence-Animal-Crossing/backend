import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GameService } from './game.service';
import { CreateGameDto } from './dto/create-game.dto';

@Controller('games')
@UseGuards(JwtAuthGuard)
export class GameController {
  constructor(private gameService: GameService) {}
  @Get('rank/:id')
  async getAllRankGames(@Param('id') id: number) {
    return this.gameService.getAllGamesById(id, true);
  }

  @Get('general/:id')
  async getAllGeneralGames(@Param('id') id: number){
    return this.gameService.getAllGamesById(id, false);
  }

  @Post('game')
  async createGame(@Body() createGameDto: CreateGameDto) {
    await this.gameService.create(createGameDto);
    return 'success';
  }
}
