import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GameService } from './game.service';
import { CreateGameDto } from './dto/create-game.dto';

@Controller('games')
@UseGuards(JwtAuthGuard)
export class GameController {
  constructor(private gameService: GameService) {}
  @Get(':id')
  async getAllGames(@Param('id') id: number) {
    return this.gameService.getAllGamesById(id);
  }

  @Post('game')
  async createGame(@Body() createGameDto: CreateGameDto) {
    await this.gameService.create(createGameDto);
    return 'success';
  }
}
