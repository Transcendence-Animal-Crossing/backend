import { Logger, UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
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
import { JoinQueueDto } from './dto/join-queue.dto';
import { QueueService } from './queue.service';

@UsePipes(new ValidationPipe())
@WebSocketGateway({ namespace: Namespace.QUEUE })
@UseFilters(new CustomSocketFilter())
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server;
  private readonly logger: Logger = new Logger('QueueGateway');

  constructor(
    private readonly clientService: ClientService,
    private readonly queueService: QueueService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const user = await this.clientService.connect(
      this.server,
      Namespace.QUEUE,
      client,
    );
    this.logger.log('[Queue WebSocket Connected!]: ' + user.nickName);
  }

  async handleDisconnect(client: Socket) {
    const user = await this.clientService.disconnect(
      this.server,
      Namespace.QUEUE,
      client,
    );
    this.logger.log('[Queue WebSocket Disconnected!]: ' + user.nickName);
  }

  @SubscribeMessage('queue-join')
  async onQueueJoin(client: Socket, dto: JoinQueueDto) {
    const userId = await this.clientService.findUserIdByClientId(
      Namespace.QUEUE,
      client.id,
    );
    await this.queueService.join(userId, dto);
  }

  @SubscribeMessage('queue-leave')
  async onQueueLeave(client: Socket) {
    const userId = await this.clientService.findUserIdByClientId(
      Namespace.QUEUE,
      client.id,
    );
    await this.queueService.leave(userId);
  }
}
