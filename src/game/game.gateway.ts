import { HttpStatus, Logger, UseFilters } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Socket } from 'socket.io';
import { ClientService } from '../ws/client.service';
import { CustomSocketFilter } from '../ws/filter/custom-socket.filter';
import { Namespace } from '../ws/const/namespace';
import { ClientRepository } from '../ws/client.repository';
import { GameRepository } from './game.repository';
import { GameKey } from './enum/game.key.enum';
import { GameService } from './game.service';
import { Game } from './model/game.model';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GameInfoDto } from './dto/game-info.dto';
import { Position } from './model/position';
import { Side } from './enum/side.enum';

// @UsePipes(new ValidationPipe())
@WebSocketGateway({ namespace: Namespace.GAME })
@UseFilters(new CustomSocketFilter())
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server;
  private readonly logger: Logger = new Logger('GameGateway');

  constructor(
    private readonly clientService: ClientService,
    private readonly clientRepository: ClientRepository,
    private readonly gameRepository: GameRepository,
    private readonly gameService: GameService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const user = await this.clientService.connect(
      this.server,
      Namespace.GAME,
      client,
    );
    this.logger.log('[Game WebSocket Connected!]: ' + user.nickName);
  }

  async handleDisconnect(client: Socket) {
    const user = await this.clientService.disconnect(
      this.server,
      Namespace.GAME,
      client,
    );
    await this.gameService.disconnect(user.id);
    this.logger.log('[Game WebSocket Disconnected!]: ' + user.nickName);
  }

  @SubscribeMessage('game-info')
  async onGameInfo(client: Socket) {
    this.logger.debug('Client Send Event <game-info>');
    const userId = await this.clientRepository.findUserId(client.id);
    const gameId = await this.gameRepository.findGameIdByUserId(userId);
    if (!gameId)
      return { status: HttpStatus.NOT_FOUND, message: 'Game Not Found' };
    const game: Game = await this.gameRepository.find(gameId);
    const gameInfo = GameInfoDto.from(game);

    const ball = Position.fromBall(game.ball);
    const leftPlayer = Position.fromPlayers(game.players, Side.LEFT);
    const rightPlayer = Position.fromPlayers(game.players, Side.RIGHT);

    return { status: 200, body: { gameInfo, ball, leftPlayer, rightPlayer } };
  }

  @SubscribeMessage('game-ready')
  async onQueueJoin(client: Socket) {
    this.logger.debug('Client Send Event <game-ready>');
    const userId = await this.clientService.findUserIdByClientId(client.id);
    const gameId = await this.gameRepository.findGameIdByUserId(userId);
    if (!gameId)
      return { status: HttpStatus.NOT_FOUND, message: 'Game Not Found' };
    const game: Game = await this.gameRepository.find(gameId);
    if (!game)
      return { status: HttpStatus.NOT_FOUND, message: 'Game Not Found' };
    game.setUserReady(userId);
    client.join(gameId);

    if (game.isEveryoneReady()) {
      game.setStart();
      this.eventEmitter.emit('start.game', game.id);
    }
    await this.gameRepository.update(game);

    return { status: HttpStatus.OK };
  }

  @SubscribeMessage('game-key-press')
  async onGameKeyPress(client: Socket, dto: { key: GameKey }) {
    this.logger.debug('Client Send Event <game-key-press>');
    const userId = await this.clientService.findUserIdByClientId(client.id);
    const gameId = await this.gameRepository.findGameIdByUserId(userId);
    if (!gameId)
      return { status: HttpStatus.NOT_FOUND, message: 'Game Not Found' };
    await this.gameService.onGameKeyPress(gameId, userId, dto.key);
    return { status: HttpStatus.OK };
  }

  @SubscribeMessage('game-key-release')
  async onGameKeyRelease(client: Socket, dto: { key: GameKey }) {
    this.logger.debug('Client Send Event <game-key-release>');
    const userId = await this.clientService.findUserIdByClientId(client.id);
    const gameId = await this.gameRepository.findGameIdByUserId(userId);
    if (!gameId)
      return { status: HttpStatus.NOT_FOUND, message: 'Game Not Found' };
    await this.gameService.onGameKeyRelease(gameId, userId, dto.key);
    return { status: HttpStatus.OK };
  }

  sendEventToGameParticipant(gameId: number, event: string, data: any) {
    this.logger.debug('Server Send Event <' + event + '>');
    if (data) this.server.to(gameId).emit(event, data);
    else this.server.to(gameId).emit(event);
  }
}
