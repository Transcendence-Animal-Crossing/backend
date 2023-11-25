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
    this.logger.log('[Game WebSocket Disconnected!]: ' + user.nickName);
  }

  @SubscribeMessage('game-info')
  async onGameInfo(client: Socket) {
    this.logger.debug('Client Send Event <game-info>');
    const userId = await this.clientRepository.findUserId(client.id);
    const gameId = await this.gameRepository.findGameIdByUserId(userId);
    if (!gameId)
      return { status: HttpStatus.NOT_FOUND, message: 'Game Not Found' };
    const game = await this.gameRepository.find(gameId);
    if (!game)
      return { status: HttpStatus.NOT_FOUND, message: 'Game Not Found' };
    return { status: 200, game };
  }

  @SubscribeMessage('game-ready')
  async onQueueJoin(client: Socket) {
    this.logger.debug('Client Send Event <game-ready>');
    const userId = await this.clientService.findUserIdByClientId(client.id);
    const gameId = await this.gameRepository.findGameIdByUserId(userId);
    if (!gameId)
      return { status: HttpStatus.NOT_FOUND, message: 'Game Not Found' };
    const game = await this.gameRepository.find(gameId);
    if (!game)
      return { status: HttpStatus.NOT_FOUND, message: 'Game Not Found' };
    if (game.leftUser.id === userId) game.leftScore = 0;
    if (game.rightUser.id === userId) game.rightScore = 0;
    await this.gameRepository.update(game);
    client.join(gameId);

    if (game.leftScore !== -1 && game.rightScore !== -1) {
      game.startTime = new Date();
      await this.gameRepository.update(game);
      this.server.to(gameId).emit('game-start', game);
    }

    return { status: HttpStatus.OK };
  }
}
