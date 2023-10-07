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

    return await this.messageRepository.find({
      where: [
        { sender: { id: user.id }, receiver: { id: target.id } },
        { sender: { id: target.id }, receiver: { id: user.id } },
      ],
      relations: {
        sender: true,
        receiver: true,
      },
      order: { created_at: 'DESC' },
      take: 20,
    });
  }
}
