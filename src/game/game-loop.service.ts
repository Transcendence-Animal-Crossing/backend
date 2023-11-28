import { Injectable, Logger } from '@nestjs/common';
import { GameRepository } from './game.repository';
import { Game } from './model/game.model';
import { OnEvent } from '@nestjs/event-emitter';
import { GameGateway } from './game.gateway';
import { GameStatus } from './enum/game.status.enum';
import { Map } from './enum/map.enum';
import { MutexManager } from '../mutex/mutex.manager';

@Injectable()
export class GameLoopService {
  private readonly logger: Logger = new Logger('GameLoopService');
  constructor(
    private readonly gameGateway: GameGateway,
    private readonly gameRepository: GameRepository,
    private readonly mutexManager: MutexManager,
  ) {}

  @OnEvent('start.game')
  async handleGameStartEvent(gameId: string) {
    const game: Game = await this.gameRepository.find(gameId);
    this.gameGateway.sendEventToGameParticipant(gameId, 'game-start', null);
    setTimeout(() => {
      game.startTime = new Date();
      this.gameLoop(game);
    }, Game.ROUND_INTERVAL);
  }

  private async gameLoop(game: Game) {
    await this.mutexManager
      .getMutex('game' + game.id)
      .runExclusive(async () => {
        if (game.status != GameStatus.PLAYING) return;
        const collisionSide = game.ball.updatePositionAndCheckCollision(
          //함수 분리해야함
          game.players,
        );
        if (collisionSide !== null) {
          game.updateScore(collisionSide);
          game.ball.init();
          game.players.init();
          this.gameGateway.sendEventToGameParticipant(game.id, 'game-score', {
            left: game.leftScore,
            right: game.rightScore,
          });
          await this.gameRepository.update(game);
          setTimeout(() => {
            this.gameLoop(game);
          }, Game.ROUND_INTERVAL);
          return;
        }
        game.players.updatePlayersPosition();
        game.ball.updateBallPosition();
        this.gameGateway.sendEventToGameParticipant(game.id, 'game-ball', {
          x: game.ball.x,
          y: game.ball.y,
        });
        this.gameGateway.sendEventToGameParticipant(game.id, 'game-player', {
          left: {
            x: game.players.leftX,
            y: game.players.leftY,
          },
          right: {
            x: game.players.rightX,
            y: game.players.rightY,
          },
        });
        this.gameRepository.update(game);
        setTimeout(() => {
          this.gameLoop(game);
        }, 1000 / Map.GAME_FRAME);
      });
  }
}
