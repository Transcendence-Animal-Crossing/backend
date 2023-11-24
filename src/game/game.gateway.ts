import { Logger, UseFilters } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Socket } from 'socket.io';
import { ClientService } from '../ws/client.service';
import { CustomSocketFilter } from '../ws/filter/custom-socket.filter';
import { Namespace } from '../ws/const/namespace';

// @UsePipes(new ValidationPipe())
@WebSocketGateway({ namespace: Namespace.GAME })
@UseFilters(new CustomSocketFilter())
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server;
  private readonly logger: Logger = new Logger('GameGateway');

  constructor(
    private readonly clientService: ClientService,
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

  // @SubscribeMessage('game-ready')
  // async onQueueJoin(client: Socket) {
  //   this.logger.debug('Client Send Event <game-ready>');
  //   const userId = await this.clientService.findUserIdByClientId(client.id);
  //   await this.queueService.join(userId, dto);
  //   return { status: HttpStatus.OK };
  // }
}
