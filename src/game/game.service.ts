import { Injectable } from '@nestjs/common';
import { GameRepository } from './game.repository';
import { GameKey } from './enum/game.key.enum';
import { Game } from './model/game.model';
import { Side } from './enum/side.enum';
import { GameStatus } from './enum/game.status.enum';
import { GameHistory } from './entities/game-history.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { GameType } from './enum/game.type.enum';

@Injectable()
export class GameService {
  constructor(
    private readonly gameRepository: GameRepository,
    @InjectRepository(GameHistory)
    private readonly gameHistoryRepository: Repository<GameHistory>,
  ) {}

  async disconnect(userId: number) {
    const gameId = await this.gameRepository.findGameIdByUserId(userId);
    if (!gameId) return;
    const game = await this.gameRepository.find(gameId);
    if (!game) return;
    if (game.status === GameStatus.WAITING) {
      game.setUserUnready(userId);
      await this.gameRepository.update(game);
    }
    if (game.status === GameStatus.PLAYING)
      await this.loseByDisconnect(game, userId);
  }

  async onGameKeyPress(gameId: string, userId: number, key: GameKey) {
    const game: Game = await this.gameRepository.find(gameId);
    if (game.leftUser.id === userId) game.players.move(Side.LEFT, key);
    if (game.rightUser.id === userId) game.players.move(Side.RIGHT, key);

    await this.gameRepository.update(game);
  }

  async onGameKeyRelease(gameId: string, userId: number, key: GameKey) {
    const game: Game = await this.gameRepository.find(gameId);
    if (game.leftUser.id === userId) game.players.stop(Side.LEFT, key);
    if (game.rightUser.id === userId) game.players.stop(Side.RIGHT, key);

    await this.gameRepository.update(game);
  }

  async initGame(
    leftUser: User,
    rightUser: User,
    gameType: GameType,
  ): Promise<Game> {
    const game = Game.create(leftUser, rightUser, gameType);
    await this.gameRepository.save(game);
    await this.gameRepository.userJoin(game.id, leftUser.id);
    await this.gameRepository.userJoin(game.id, rightUser.id);

    return game;
  }

  async loseByDisconnect(game: Game, userId: number) {
    game.loseByDisconnect(userId);
    await this.gameHistoryRepository.save(GameHistory.from(game));
    await this.gameRepository.delete(game.id);
  }
}
