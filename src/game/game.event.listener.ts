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
import { User } from '../user/entities/user.entity';
import { GameType } from './enum/game.type.enum';
import { ChatGateway } from '../chat/chat.gateway';
import { UserProfile } from '../user/model/user.profile.model';

@Injectable()
export class GameEventListener {
  private readonly logger: Logger = new Logger('GameEventListener');

  constructor(
    private readonly chatGateway: ChatGateway,
    private readonly gameGateway: GameGateway,
    private readonly gameService: GameService,
    private readonly gameLoopService: GameLoopService,
    private readonly gameRepository: GameRepository,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(GameHistory)
    private readonly gameHistoryRepository: Repository<GameHistory>,
    @InjectRepository(GameRecord)
    private readonly gameRecordRepository: Repository<GameRecord>,
  ) {}

  @OnEvent('custom.game')
  async handleInviteGameEvent(dto: { senderId: number; receiverId: number }) {
    const leftUser = await this.userRepository.findOneBy({ id: dto.senderId });
    const rightUser = await this.userRepository.findOneBy({
      id: dto.receiverId,
    });
    const game = Game.create(leftUser, rightUser, GameType.NORMAL);
    await this.gameRepository.save(game);
    await this.gameRepository.userJoin(game.id, leftUser.id);
    await this.gameRepository.userJoin(game.id, rightUser.id);

    const leftClient = await this.gameGateway.findClientByUserId(leftUser.id);
    const rightClient = await this.gameGateway.findClientByUserId(rightUser.id);
    if (leftClient) leftClient.join(game.id);
    if (rightClient) rightClient.join(game.id);
    await this.chatGateway.sendProfileUpdateToFriends(
      UserProfile.fromUser(leftUser),
    );
    await this.chatGateway.sendProfileUpdateToFriends(
      UserProfile.fromUser(rightUser),
    );

    this.gameGateway.sendEvent(game.id, 'game-matched', { id: game.id });

    setTimeout(async () => {
      await this.handleValidateGameEvent(game.id);
    }, Game.READY_TIMEOUT);
  }

  @OnEvent('start.game')
  async handleGameStartEvent(game: Game) {
    this.gameGateway.sendEvent(game.id, 'game-start', null);
    this.gameGateway.sendEvent(
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
      rankScore: () => 'rankScore + 10',
    });
    await this.gameRecordRepository.update(unreadyUserId, {
      rankTotalCount: () => 'rankTotalCount + 1',
      rankScore: () => 'rankScore - 10',
    });

    this.gameGateway.sendEvent(gameId, 'game-end', null);

    await this.gameRepository.delete(gameId);
    await this.gameRepository.userLeave(game.leftUser.id);
    await this.gameRepository.userLeave(game.rightUser.id);
    this.gameGateway.server.socketsLeave(gameId);
  }
}
