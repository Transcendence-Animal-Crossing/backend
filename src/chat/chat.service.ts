import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entity/message.entity';
import { DirectMessageDto } from './dto/direct-message.dto';
import { UserService } from '../user/user.service';
import { LoadMessageDto } from './dto/load-message.dto';
import { Socket } from 'socket.io';
import { ClientService } from '../ws/client.service';
import { FollowService } from '../folllow/follow.service';
import { MessageHistory } from './entity/messageHistory.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(MessageHistory)
    private readonly messageHistoryRepository: Repository<MessageHistory>,
    private readonly userService: UserService,
    private readonly clientService: ClientService,
    private readonly followService: FollowService,
  ) {}

  async save(dto: DirectMessageDto) {
    const sender = await this.userService.findOne(dto.senderId);
    const receiver = await this.userService.findOne(dto.receiverId);
    const historyId = MessageHistory.createHistoryId(receiver.id, sender.id);
    const history = MessageHistory.create(historyId);
    await this.messageHistoryRepository.upsert(history, ['id']);

    // const message = this.messageRepository.create(historyId, dto.text);
    const message = Message.create(historyId, dto.text);
    return await this.messageRepository.save(message);
  }

  async findUnReadMessageFromFriend(userId: number, friendId: number) {
    const historyId = MessageHistory.createHistoryId(userId, friendId);
    let history = await this.messageHistoryRepository.findOneBy({
      id: historyId,
    });
    if (!history) {
      history = MessageHistory.create(historyId);
      await this.messageHistoryRepository.upsert(history, ['id']);
    }
    const unreadMessageData = await this.messageRepository
      .createQueryBuilder('message')
      .select('message.id AS id')
      .addSelect('message.text AS text')
      .addSelect('message.created_at AS date')
      .where('message.history_id = :historyId', { historyId: history.id })
      .andWhere('message.id > :lastReadMessageId', {
        lastReadMessageId: history.lastReadMessageId,
      })
      .getRawMany();
    return unreadMessageData.map((data) => ({
      id: data.id,
      date: data.date,
      text: data.text,
    }));
  }

  async loadWithPagination(userId: number, dto: LoadMessageDto) {
    const user = await this.userService.findOne(userId);
    const target = await this.userService.findOne(dto.targetId);
    const historyId = MessageHistory.createHistoryId(user.id, target.id);

    let whereCondition = 'message.historyId = :historyId ';
    if (dto.cursorId) whereCondition += 'AND message.id < :cursorId';

    const messageData = await this.messageRepository
      .createQueryBuilder('message')
      .select([
        'message.id AS messageId',
        'message.text AS text',
        'message.created_at AS date',
      ])
      .where(whereCondition, {
        historyId: historyId,
        cursorId: dto.cursorId,
      })
      .orderBy('messageId', 'DESC')
      .take(20)
      .getRawMany();

    return messageData.map((data) => ({
      id: data.messageid,
      senderId: target.id,
      date: data.date,
      text: data.text,
    }));
  }

  async send(client: Socket, dto: DirectMessageDto) {
    dto.senderId = await this.clientService.findUserIdByClientId(client.id);
    if (!(await this.followService.isFollow(dto.senderId, dto.receiverId)))
      return;
    const message = await this.save(dto);
    const receiverClient = await this.clientService.findClientIdByUserId(
      dto.receiverId,
    );
    if (receiverClient)
      client.to(receiverClient).emit('dm', {
        id: message.id,
        senderId: dto.senderId,
        date: message.created_at,
        text: message.text,
      });
    client.emit('dm', {
      id: message.id,
      senderId: dto.senderId,
      date: message.created_at,
      text: message.text,
    });
  }

  async updateLastRead(userId: number, beforeFocus: number) {
    const historyId = MessageHistory.createHistoryId(userId, beforeFocus);
    const lastMessage = await this.messageRepository
      .createQueryBuilder('message')
      .select('message.id AS id')
      .where('history_id = :historyId', { historyId: historyId })
      .orderBy('message.id', 'DESC')
      .getRawOne();

    if (lastMessage)
      await this.messageHistoryRepository.update(
        { id: historyId },
        { lastReadMessageId: lastMessage.id },
      );
  }
}
