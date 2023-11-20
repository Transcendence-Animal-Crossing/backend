import { Injectable } from '@nestjs/common';
import { ChatGateway } from '../chat/chat.gateway';
import { OnEvent } from '@nestjs/event-emitter';
import { UserData } from '../room/data/user.data';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';

@Injectable()
export class ClientListener {
  constructor(
    private readonly chatGateWay: ChatGateway,
    private readonly userRepository: Repository<User>,
  ) {}

  @OnEvent('update.profile')
  async handleUpdateProfileEvent(profile: UserData) {
    await this.chatGateWay.handleProfileChange(profile);
  }

  @OnEvent('new.friend')
  async handleNewFriendEvent(followerId: number, followingId: number) {
    const follower = await this.userRepository.findOneBy({ id: followerId });
    const following = await this.userRepository.findOneBy({ id: followingId });
    await this.chatGateWay.handleNewFriend(
      UserData.from(follower),
      UserData.from(following),
    );
  }

  @OnEvent('delete.friend')
  async handleDeleteFriendEvent(followerId: number, followingId: number) {
    await this.chatGateWay.handleDeleteFriend(followerId, followingId);
  }

  @OnEvent('add.block')
  async handleBlockUserEvent(blockerId: number, blockedId: number) {
    await this.chatGateWay.handleBlockUser(blockerId, blockedId);
  }

  @OnEvent('delete.block')
  async handleUnBlockUserEvent(blockerId: number, unBlockedId: number) {
    await this.chatGateWay.handleUnBlockUser(blockerId, unBlockedId);
  }
}
