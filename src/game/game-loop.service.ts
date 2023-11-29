import { Injectable, Logger } from '@nestjs/common';
import { GameRepository } from './game.repository';
import { Game } from './model/game.model';
import { GameGateway } from './game.gateway';
import { GameStatus } from './enum/game.status.enum';
import { GameSetting } from './enum/game-setting.enum';
import { MutexManager } from '../mutex/mutex.manager';
import { GameRecord } from '../gameRecord/entities/game-record';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class GameLoopService {
  private readonly logger: Logger = new Logger('GameLoopService');
  constructor(
    private readonly gameGateway: GameGateway,
    private readonly gameRepository: GameRepository,
    private readonly mutexManager: MutexManager,
    @InjectRepository(GameRecord)
    private readonly gameRecordRepository: Repository<GameRecord>,
  ) {}

  async gameLoop(gameId: string) {
    await this.mutexManager.getMutex('game' + gameId).runExclusive(async () => {
      const game: Game = await this.gameRepository.find(gameId);
      if (!game) return;
      if (game.status != GameStatus.PLAYING) return;
      game.players.updatePlayersPosition();
      game.ball.updateBallPosition();
      const collisionSide = game.ball.updatePositionAndCheckCollision(
        //함수 분리해야함
        game.players,
      );
      if (collisionSide !== null) {
        game.updateScore(collisionSide);
        this.gameGateway.sendEventToGameParticipant(game.id, 'game-score', {
          left: game.leftScore,
          right: game.rightScore,
        });
        game.ball.init();
        game.players.init();
        if (game.isEnd()) {
          this.gameGateway.sendEventToGameParticipant(
            game.id,
            'game-end',
            null,
          );
          await this.gameRecordUpdate(game);
          await this.gameRepository.delete(gameId);
          await this.gameRepository.userLeave(game.leftUser.id);
          await this.gameRepository.userLeave(game.rightUser.id);
          this.gameGateway.server.socketsLeave(gameId);
          return;
        }
        await this.gameRepository.update(game);
        setTimeout(() => {
          this.gameLoop(gameId);
        }, Game.ROUND_INTERVAL);
        return;
      }
      this.gameGateway.sendEventToGameParticipant(game.id, 'game-ball', {
        x: game.ball.x,
        y: GameSetting.HEIGHT - game.ball.y,
      });
      this.gameGateway.sendEventToGameParticipant(game.id, 'game-player', {
        left: {
          x: game.players.leftX,
          y: GameSetting.HEIGHT - game.players.leftY,
        },
        right: {
          x: game.players.rightX,
          y: GameSetting.HEIGHT - game.players.rightY,
        },
      });
      await this.gameRepository.update(game);
      setTimeout(() => {
        this.gameLoop(game.id);
      }, 1000 / GameSetting.GAME_FRAME);
    });
  }

  private async gameRecordUpdate(game: Game) {
    const winnerId = game.findWinnerId();
    const loserId = game.findOpponentId(winnerId);
    await this.gameRecordRepository.update(winnerId, {
      rankTotalCount: () => 'rankTotalCount + 1',
      rankWinCount: () => 'rankWinCount + 1',
      rankScore: () => 'rankScore + 10',
    });
    await this.gameRecordRepository.update(loserId, {
      rankTotalCount: () => 'rankTotalCount + 1',
      rankScore: () => 'rankScore - 10',
    });
  }
}
