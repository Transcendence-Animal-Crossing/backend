import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entity/message.entity';
import { DirectMessageDto } from './dto/direct-message.dto';
import { UserService } from '../user/user.service';
import { LoadMessageDto } from './dto/load-message.dto';
import { UnreadMessageDto } from './dto/unread-message.dto';
import { Socket } from 'socket.io';
import { ClientService } from '../ws/client.service';
import { ViewMessageDto } from './dto/view-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly userService: UserService,
    private readonly clientService: ClientService,
  ) {}

  async createAndSave(dto: DirectMessageDto, viewed: boolean) {
    const sender = await this.userService.findOne(dto.senderId);
    const receiver = await this.userService.findOne(dto.receiverId);
    const message = this.messageRepository.create(
      Message.create(dto.text, viewed, sender, receiver),
    );
    return await this.messageRepository.save(message);
  }

  async countUnReadMessage(userId: number) {
    const user = await this.userService.findOne(userId);
    const unreadMessageData: Array<UnreadMessageDto> =
      await this.messageRepository
        .createQueryBuilder('message')
        .select('message.senderId AS senderId')
        .addSelect('COUNT(*) AS cnt')
        .where('message.receiverId = :receiverId', { receiverId: user.id })
        .andWhere('message.viewed = :viewed', { viewed: false })
        .groupBy('message.senderId')
        .getRawMany();
    const unreadMessageCount = {};
    for (const data of unreadMessageData) {
      unreadMessageCount[data.getSenderId()] = data.getCount();
    }
    return unreadMessageCount;
  }

  async loadWithPagination(userId: number, dto: LoadMessageDto) {
    const user = await this.userService.findOne(userId);
    const target = await this.userService.findOne(dto.targetId);

    let whereCondition =
      '((sender.id = :userId AND receiver.id = :targetId) ' +
      'OR ' +
      '(sender.id = :targetId AND receiver.id = :userId)) ';
    if (dto.cursorId) whereCondition += 'AND message.id < :cursorId';

    const messageData = await this.messageRepository
      .createQueryBuilder('message')
      .select([
        'message.id AS messageId',
        'message.text AS text',
        'message.created_at AS date',
        'sender.id AS senderid',
        'receiver.id AS receiverid',
      ])
      .innerJoin('message.sender', 'sender')
      .innerJoin('message.receiver', 'receiver')
      .where(whereCondition, {
        userId: user.id,
        targetId: target.id,
        cursorId: dto.cursorId,
      })
      .orderBy('messageId', 'ASC')
      .take(20)
      .getRawMany();

    return messageData.map((data) => ({
      messageId: data.messageid,
      senderId: data.senderid,
      receiverId: data.receiverid,
      date: data.date,
      text: data.text,
    }));
  }

  async loadAllUnViewed(userId: number, loadMessageDto: LoadMessageDto) {
    const user = await this.userService.findOne(userId);
    const target = await this.userService.findOne(loadMessageDto.targetId);

    let whereCondition =
      '((sender.id = :userId AND receiver.id = :targetId) ' +
      'OR ' +
      '(sender.id = :targetId AND receiver.id = :userId)) ';
    whereCondition += 'AND message.viewed = false ';

    const messageData = await this.messageRepository
      .createQueryBuilder('message')
      .select([
        'message.id AS messageId',
        'message.text AS text',
        'message.created_at AS date',
        'sender.id AS senderid',
        'receiver.id AS receiverid',
      ])
      .innerJoin('message.sender', 'sender')
      .innerJoin('message.receiver', 'receiver')
      .where(whereCondition, {
        userId: user.id,
        targetId: target.id,
      })
      .orderBy('messageId', 'ASC')
      .take(20)
      .getRawMany();

    if (messageData.length > 0) {
      await this.messageRepository
        .createQueryBuilder('message')
        .update()
        .set({ viewed: true })
        .where('message.receiverId = :receiverId', { receiverId: user.id })
        .andWhere('message.senderId = :senderId', { senderId: target.id })
        .andWhere('message.id >= :cursorId', {
          cursorId: messageData[0].messageId,
        })
        .execute();
    }

    return messageData.map((data) => ({
      messageId: data.messageid,
      senderId: data.senderid,
      receiverId: data.receiverid,
      date: data.date,
      text: data.text,
    }));
  }

  async send(client: Socket, dto: DirectMessageDto) {
    dto.senderId = await this.clientService.findUserIdByClientId(client.id);
    const receiver = await this.clientService.findClientIdByUserId(
      dto.receiverId,
    );
    if (!receiver) {
      await this.createAndSave(dto, false);
      return;
    }
    client
      .to(receiver)
      .except('block-' + dto.senderId)
      .emit('direct-message', dto);
    const { viewed } = await client.emitWithAck('direct-message', dto);

    await this.createAndSave(dto, viewed);
  }

  async view(receiverId: number, dto: ViewMessageDto) {
    await this.messageRepository
      .createQueryBuilder('message')
      .update()
      .set({ viewed: true })
      .where('message.receiverId = :receiverId', { receiverId: receiverId })
      .andWhere('message.senderId = :senderId', { senderId: dto.targetId })
      .andWhere('message.id >= :minId', {
        minId: dto.minId,
      })
      .andWhere('message.id <= :maxId', {
        maxId: dto.maxId,
      })
      .execute();
  }
}
