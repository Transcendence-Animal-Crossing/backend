import { Injectable } from '@nestjs/common';
import { GameRepository } from './game.repository';
import { GameKey } from './enum/game.key.enum';
import { PlayersRepository } from './players.repository';
import { Players } from './model/players.model';
import { Game } from './model/game.model';
import { Side } from './enum/side.enum';
import { GameStatus } from './enum/game.status.enum';

@Injectable()
export class GameService {
  constructor(
    private readonly gameRepository: GameRepository,
    private readonly playersRepository: PlayersRepository,
  ) {}

  async disconnect(userId: number) {
    const gameId = await this.gameRepository.findGameIdByUserId(userId);
    if (!gameId) return;
    const game = await this.gameRepository.find(gameId);
    if (!game) return;
    if (game.status === GameStatus.WAITING) {
      game.setUserUnready(userId);
    }
    await this.gameRepository.update(game);
  }

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
