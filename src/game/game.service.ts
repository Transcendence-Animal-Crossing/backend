import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MutexManager } from '../mutex/mutex.manager';
import { SimpleGameDto } from './dto/simple-game.dto';
import { GameRecord } from '../gameRecord/entities/game-record';

@Injectable()
export class GameService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly mutexManager: MutexManager,
    private readonly gameRepository: GameRepository,
    @InjectRepository(GameHistory)
    private readonly gameHistoryRepository: Repository<GameHistory>,
    @InjectRepository(GameRecord)
    private readonly gameRecordRepository: Repository<GameRecord>,
  ) {}

  async findGameInProgress(): Promise<SimpleGameDto[]> {
    const games = await this.gameRepository.findAll();
    return games.map((game) => SimpleGameDto.from(game));
  }

  async disconnect(server, client, userId: number): Promise<string> {
    const gameId = await this.gameRepository.findGameIdByUserId(userId);
    if (!gameId) return null;
    await this.gameRepository.userLeave(userId);

    const game = await this.gameRepository.find(gameId);
    if (!game) return null;
    if (game.status === GameStatus.WAITING) {
      game.setUserUnready(userId);
      await this.gameRepository.update(game);
    }
    if (game.status === GameStatus.PLAYING) {
      await this.loseByDisconnect(game, userId);
      server.to(gameId).emit('game-end');
      server.socketsLeave(gameId);
    }
    return game.id;
  }

  async onGameKeyPress(gameId: string, userId: number, key: GameKey) {
    await this.mutexManager.getMutex(gameId).runExclusive(async () => {
      const game: Game = await this.gameRepository.find(gameId);
      if (game.leftUser.id === userId) game.players.move(Side.LEFT, key);
      if (game.rightUser.id === userId) game.players.move(Side.RIGHT, key);

      await this.gameRepository.update(game);
    });
  }

  async onGameKeyRelease(gameId: string, userId: number, key: GameKey) {
    await this.mutexManager.getMutex(gameId).runExclusive(async () => {
      const game: Game = await this.gameRepository.find(gameId);
      if (game.leftUser.id === userId) game.players.stop(Side.LEFT, key);
      if (game.rightUser.id === userId) game.players.stop(Side.RIGHT, key);

      await this.gameRepository.update(game);
    });
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

  async ready(userId: number, gameId: string) {
    await this.mutexManager.getMutex(gameId).runExclusive(async () => {
      const game: Game = await this.gameRepository.find(gameId);
      if (!game) throw new NotFoundException('Game Not Found');
      if (game.status !== GameStatus.WAITING)
        throw new ConflictException('Game Already Started');
      game.setUserReady(userId);

      if (game.isEveryoneReady()) {
        game.setStart();
        this.eventEmitter.emit('start.game', game);
      }
      await this.gameRepository.update(game);
    });
  }

  async loseByDisconnect(game: Game, userId: number) {
    game.loseByDisconnect(userId);
    await this.gameRepository.delete(game.id);
    await this.gameRepository.userLeave(game.leftUser.id);
    await this.gameRepository.userLeave(game.rightUser.id);

    await this.gameHistoryRepository.save(GameHistory.from(game));
    const opponentId = game.findOpponentId(userId);
    await this.gameRecordRepository.update(opponentId, {
      rankTotalCount: () => 'rankTotalCount + 1',
      rankWinCount: () => 'rankWinCount + 1',
      rankScore: () => 'rankScore + 10',
    });
    await this.gameRecordRepository.update(userId, {
      rankTotalCount: () => 'rankTotalCount + 1',
      rankScore: () => 'rankScore - 10',
    });
  }
}
