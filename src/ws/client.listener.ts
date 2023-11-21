import { Injectable, Logger } from '@nestjs/common';
import { ChatGateway } from '../chat/chat.gateway';
import { OnEvent } from '@nestjs/event-emitter';
import { UserData } from '../room/data/user.data';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ClientListener {
  private readonly logger: Logger = new Logger('ClientListener');
  constructor(
    private readonly chatGateWay: ChatGateway,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @OnEvent('update.profile')
  async handleUpdateProfileEvent(profile: UserData) {
    this.logger.debug('<update.profile> event is triggered!');
    await this.chatGateWay.handleProfileChange(profile);
  }

  @OnEvent('new.friend')
  async handleNewFriendEvent(followerId: number, followingId: number) {
    this.logger.debug('<new.friend> event is triggered!');
    const follower = await this.userRepository.findOneBy({ id: followerId });
    const following = await this.userRepository.findOneBy({ id: followingId });
    await this.chatGateWay.handleNewFriend(
      UserData.from(follower),
      UserData.from(following),
    );
  }

  @OnEvent('delete.friend')
  async handleDeleteFriendEvent(followerId: number, followingId: number) {
    this.logger.debug('<delete.friend> event is triggered!');
    await this.chatGateWay.handleDeleteFriend(followerId, followingId);
  }

  @OnEvent('add.block')
  async handleBlockUserEvent(blockerId: number, blockedId: number) {
    this.logger.debug('<add.block> event is triggered!');
    await this.chatGateWay.handleBlockUser(blockerId, blockedId);
  }

  @OnEvent('delete.block')
  async handleUnBlockUserEvent(blockerId: number, unBlockedId: number) {
    this.logger.debug('<delete.block> event is triggered!');
    await this.chatGateWay.handleUnBlockUser(blockerId, unBlockedId);
  }
}
