import { Injectable } from '@nestjs/common';
import { GameRepository } from './game.repository';
import { GameKey } from './enum/game.key.enum';
import { PlayersRepository } from './players.repository';
import { Players } from './model/players.model';
import { Game } from './model/game.model';
import { Side } from './enum/side.enum';

@Injectable()
export class GameService {
  constructor(
    private readonly gameRepository: GameRepository,
    private readonly playersRepository: PlayersRepository,
  ) {}

  async onGameKeyPress(gameId: string, userId: number, key: GameKey) {
    const game: Game = await this.gameRepository.find(gameId);
    const players: Players = await this.playersRepository.find(gameId);
    if (!players) return;
    if (game.leftUser.id === userId) players.move(Side.LEFT, key);
    if (game.rightUser.id === userId) players.move(Side.RIGHT, key);

    await this.playersRepository.update(players);
  }

  async onGameKeyRelease(gameId: string, userId: number, key: GameKey) {
    const game: Game = await this.gameRepository.find(gameId);
    const players: Players = await this.playersRepository.find(gameId);
    if (!players) return;
    if (game.leftUser.id === userId) players.stop(Side.LEFT, key);
    if (game.rightUser.id === userId) players.stop(Side.RIGHT, key);

    await this.playersRepository.update(players);
  }
}
