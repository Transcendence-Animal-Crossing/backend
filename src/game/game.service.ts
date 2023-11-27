import { Injectable } from '@nestjs/common';
import { GameRepository } from './game.repository';
import { GameKey } from './enum/game.key.enum';
import { PlayersRepository } from './players.repository';
import { Players } from './model/players.model';
import { Game } from './model/game.model';
import { Side } from './enum/side.enum';
import { GameStatus } from './enum/game.status.enum';
import { GameHistory } from './entities/game-history.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { GameType } from './enum/game.type.enum';
import { Ball } from './model/ball.model';
import { BallRepository } from './ball.repository';

@Injectable()
export class GameService {
  constructor(
    private readonly gameRepository: GameRepository,
    private readonly playersRepository: PlayersRepository,
    private readonly ballRepository: BallRepository,
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

  async initGame(
    leftUser: User,
    rightUser: User,
    gameType: GameType,
  ): Promise<Game> {
    const game = Game.create(leftUser, rightUser, gameType);
    await this.gameRepository.save(game);
    const ball = Ball.create(game.id);
    await this.ballRepository.save(ball);
    const players = Players.create(game.id, gameType);
    await this.playersRepository.save(players);
    await this.gameRepository.userJoin(game.id, leftUser.id);
    await this.gameRepository.userJoin(game.id, rightUser.id);

    return game;
  }

  async loseByDisconnect(game: Game, userId: number) {
    game.loseByDisconnect(userId);
    await this.gameHistoryRepository.save(GameHistory.from(game));
    await this.gameRepository.delete(game.id);
    await this.playersRepository.delete(game.id);
    await this.ballRepository.delete(game.id);
  }

  async findGameInfo(gameId: string) {
    const game = await this.gameRepository.find(gameId);
    const players = await this.playersRepository.find(gameId);
    const ball = await this.ballRepository.find(gameId);

    return { game, players, ball };
  }
}
