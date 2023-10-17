import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entity/message.entity';
import { DirectMessageDto } from './dto/direct-message.dto';
import { UserService } from '../user/user.service';
import { LoadMessageDto } from './dto/load-message.dto';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly userService: UserService,
  ) {}

  async createAndSave(dto: DirectMessageDto) {
    const sender = await this.userService.findOne(dto.senderId);
    const receiver = await this.userService.findOne(dto.receiverId);
    const message = this.messageRepository.create(
      Message.create(dto.text, sender, receiver),
    );
    return await this.messageRepository.save(message);
  }

  async loadMessage(userId: number, loadMessageDto: LoadMessageDto) {
    const user = await this.userService.findOne(userId);
    const target = await this.userService.findOne(loadMessageDto.targetId);

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
      .where(
        '(sender.id = :userId AND receiver.id = :targetId) OR (sender.id = :targetId AND receiver.id = :userId)',
        { userId: user.id, targetId: target.id },
      )
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
}
