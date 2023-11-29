import { Injectable, Logger } from '@nestjs/common';
import { Game } from './model/game.model';
import { OnEvent } from '@nestjs/event-emitter';
import { GameGateway } from './game.gateway';
import { SimpleGameDto } from './dto/simple-game.dto';
import { GameLoopService } from './game-loop.service';
import { GameHistory } from './entities/game-history.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameRepository } from './game.repository';
import { GameService } from './game.service';
import { GameRecord } from '../gameRecord/entities/game-record';

@Injectable()
export class GameEventListener {
  private readonly logger: Logger = new Logger('GameEventListener');
  constructor(
    private readonly gameGateway: GameGateway,
    private readonly gameService: GameService,
    private readonly gameLoopService: GameLoopService,
    private readonly gameRepository: GameRepository,
    @InjectRepository(GameHistory)
    private readonly gameHistoryRepository: Repository<GameHistory>,
    @InjectRepository(GameRecord)
    private readonly gameRecordRepository: Repository<GameRecord>,
  ) {}

  @OnEvent('start.game')
  async handleGameStartEvent(game: Game) {
    this.gameGateway.sendEventToGameParticipant(game.id, 'game-start', null);
    this.gameGateway.sendEventToGameParticipant(
      'game-lobby',
      'game-add',
      SimpleGameDto.from(game),
    );
    setTimeout(async () => {
      await this.gameLoopService.gameLoop(game.id);
    }, Game.ROUND_INTERVAL);
  }

  @OnEvent('validate.game')
  async handleValidateGameEvent(gameId: string) {
    this.logger.debug('<validate.game> event is triggered!');
    const game = await this.gameRepository.find(gameId);
    if (!game) return;
    if (game.isEveryoneReady()) return;
    if (game.isEveryoneUnready()) {
      await this.gameRepository.delete(gameId);
      await this.gameRepository.userLeave(game.leftUser.id);
      await this.gameRepository.userLeave(game.rightUser.id);
      this.gameGateway.server.socketsLeave(gameId);
      return;
    }
    const unreadyUserId = game.findUnReadyOneId();
    if (!unreadyUserId) return;
    const readyUserId = game.findOpponentId(unreadyUserId);

    game.loseByDisconnect(unreadyUserId);
    await this.gameHistoryRepository.save(GameHistory.from(game));

    await this.gameRecordRepository.update(readyUserId, {
      rankTotalCount: () => 'rankTotalCount + 1',
      rankWinCount: () => 'rankWinCount + 1',
    });
    await this.gameRecordRepository.update(unreadyUserId, {
      rankTotalCount: () => 'rankTotalCount + 1',
    });

    this.gameGateway.sendEventToGameParticipant(gameId, 'game-end', null);

    await this.gameRepository.delete(gameId);
    await this.gameRepository.userLeave(game.leftUser.id);
    await this.gameRepository.userLeave(game.rightUser.id);
    this.gameGateway.server.socketsLeave(gameId);
  }
}
