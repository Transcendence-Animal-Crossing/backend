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
import { JoinQueueDto } from './dto/join-queue.dto';
import { QueueService } from './queue.service';

// @UsePipes(new ValidationPipe())
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
    try {
      await this.queueService.leave(user.id);
    } catch (e) {}
    this.logger.log('[Queue WebSocket Disconnected!]: ' + user.nickName);
  }

  @SubscribeMessage('queue-join')
  async onQueueJoin(client: Socket, dto: JoinQueueDto) {
    this.logger.debug('Client Send Event <queue-join>');
    const userId = await this.clientService.findUserIdByClientId(client.id);
    await this.queueService.join(userId, dto);
    return { status: HttpStatus.OK };
  }

  @SubscribeMessage('queue-leave')
  async onQueueLeave(client: Socket) {
    this.logger.debug('Client Send Event <queue-leave>');
    const userId = await this.clientService.findUserIdByClientId(client.id);
    await this.queueService.leave(userId);
    // 실패도 만들어야 함 (이미 매칭이 되었거나, 매칭 대기열에 없는 경우)
    return { status: HttpStatus.OK };
  }

  async sendEventToClient(userId: number, event: string, data: any) {
    this.logger.debug('Server Send Event to Client: ' + event);
    const client: Socket = await this.clientService.getClientByUserId(
      this.server,
      Namespace.QUEUE,
      userId,
    );
    client.emit(event, data);
  }
}
