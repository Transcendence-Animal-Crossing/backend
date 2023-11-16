import { Logger, UseFilters } from '@nestjs/common';
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

@WebSocketGateway({ namespace: '/queue' })
@UseFilters(new CustomSocketFilter())
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server;
  private readonly logger: Logger = new Logger('QueueGateway');

  constructor(private readonly clientService: ClientService) {}

  async handleConnection(client: Socket): Promise<void> {
    const user = await this.clientService.connect(client);
    this.logger.log('[Queue WebSocket Connected!]: ' + user.nickName);
  }

  async handleDisconnect(client: Socket) {
    const user = await this.clientService.disconnect(client);
    this.logger.log('[Queue WebSocket Disconnected!]: ' + user.nickName);
  }
}
