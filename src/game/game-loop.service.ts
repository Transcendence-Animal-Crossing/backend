import { Injectable, Logger } from '@nestjs/common';
import { GameRepository } from './game.repository';
import { Game } from './model/game.model';
import { OnEvent } from '@nestjs/event-emitter';
import { GameGateway } from './game.gateway';

@Injectable()
export class GameLoopService {
  private readonly logger: Logger = new Logger('GameLoopService');
  constructor(
    private readonly gameGateway: GameGateway,
    private readonly gameRepository: GameRepository,
  ) {}

  @OnEvent('game.start')
  async handleGameStartEvent(gameId: number) {
    const game: Game = await this.gameRepository.find(gameId);
    this.gameGateway.server.to(gameId).emit('game-start');
    setTimeout(() => {
      game.startTime = new Date();
      this.gameLoop(game);
    }, Game.ROUND_INTERVAL);
  }

  private gameLoop(game: Game) {
    this.logger.debug('<start.game> event is triggered!');

    /**
     * TODO: 게임 루프 구현
     */
  }
}
