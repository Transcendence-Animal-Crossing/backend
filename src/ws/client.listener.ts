import { Injectable } from '@nestjs/common';
import { ChatGateway } from '../chat/chat.gateway';
import { OnEvent } from '@nestjs/event-emitter';
import { UserData } from '../room/data/user.data';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { RoomRepository } from '../room/room.repository';

@Injectable()
export class ClientListener {
  constructor(
    private readonly chatGateWay: ChatGateway,
    private readonly userRepository: Repository<User>,
    private readonly roomRepository: RoomRepository,
  ) {}

  @OnEvent('update.profile')
  async handleUpdateProfileEvent(profile: UserData) {
    await this.chatGateWay.sendProfileUpdateToFriends(profile);
    const roomId = await this.roomRepository.findRoomIdByUserId(profile.id);
    if (!roomId) return;
    const room = await this.roomRepository.find(roomId);
    if (!room) return;

    for (const participant of room.participants) {
      if (participant.id === profile.id) {
        participant.nickName = profile.nickName;
        participant.avatar = profile.avatar;
        break;
      }
    }
    await this.roomRepository.update(room);
    await this.chatGateWay.sendProfileUpdateToRoom(profile, roomId);
  }

  @OnEvent('new.friend')
  async handleNewFriendEvent(followerId: number, followingId: number) {
    const follower = await this.userRepository.findOneBy({ id: followerId });
    const following = await this.userRepository.findOneBy({ id: followingId });
    await this.chatGateWay.sendNewFriend(
      UserData.from(follower),
      UserData.from(following),
    );
  }

  @OnEvent('delete.friend')
  async handleDeleteFriendEvent(followerId: number, followingId: number) {
    await this.chatGateWay.sendDeleteFriend(followerId, followingId);
  }

  @OnEvent('add.block')
  async handleBlockUserEvent(blockerId: number, blockedId: number) {
    await this.chatGateWay.sendBlockUser(blockerId, blockedId);
  }

  @OnEvent('delete.block')
  async handleUnBlockUserEvent(blockerId: number, unBlockedId: number) {
    await this.chatGateWay.sendUnBlockUser(blockerId, unBlockedId);
  }
}
