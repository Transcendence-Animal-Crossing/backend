import { Injectable, Logger } from '@nestjs/common';
import { ChatGateway } from '../chat/chat.gateway';
import { OnEvent } from '@nestjs/event-emitter';
import { UserData } from '../room/data/user.data';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { RoomRepository } from '../room/room.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { GameRepository } from '../game/game.repository';
import { GameGateway } from '../game/game.gateway';

@Injectable()
export class EventListener {
  private readonly logger: Logger = new Logger('EventListener');
  constructor(
    private readonly chatGateWay: ChatGateway,
    private readonly gameGateway: GameGateway,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly roomRepository: RoomRepository,
    private readonly gameRepository: GameRepository,
  ) {}

  @OnEvent('update.profile')
  async handleUpdateProfileEvent(profile: UserData) {
    this.logger.debug('<update.profile> event is triggered!');
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
    this.logger.debug('<new.friend> event is triggered!');
    const follower = await this.userRepository.findOneBy({ id: followerId });
    const following = await this.userRepository.findOneBy({ id: followingId });
    await this.chatGateWay.sendNewFriend(
      UserData.from(follower),
      UserData.from(following),
    );
  }

  @OnEvent('new.friend.request')
  async handleNewFriendRequestEvent(senderId: number, receiverId: number) {
    this.logger.debug('<new.friend.request> event is triggered!');
    const sender = await this.userRepository.findOneBy({ id: senderId });
    await this.chatGateWay.handleNewFriendRequest(sender, receiverId);
  }

  @OnEvent('delete.friend.request')
  async handleDeleteFriendRequestEvent(senderId: number, receiverId: number) {
    this.logger.debug('<delete.friend.request> event is triggered!');
    await this.chatGateWay.handleDeleteFriendRequest(senderId, receiverId);
  }

  @OnEvent('delete.friend')
  async handleDeleteFriendEvent(followerId: number, followingId: number) {
    this.logger.debug('<delete.friend> event is triggered!');
    await this.chatGateWay.sendDeleteFriend(followerId, followingId);
  }

  @OnEvent('delete.room')
  async handleDeleteRoomEvent(roomId: string) {
    this.logger.debug('<delete.room> event is triggered!');
    await this.chatGateWay.handleDeleteRoom(roomId);
  }

  @OnEvent('add.block')
  async handleBlockUserEvent(blockerId: number, blockedId: number) {
    this.logger.debug('<add.block> event is triggered!');
    await this.chatGateWay.sendBlockUser(blockerId, blockedId);
  }

  @OnEvent('delete.block')
  async handleUnBlockUserEvent(blockerId: number, unBlockedId: number) {
    this.logger.debug('<delete.block> event is triggered!');
    await this.chatGateWay.sendUnBlockUser(blockerId, unBlockedId);
  }

  @OnEvent('validate.game')
  async handleValidateGameEvent(gameId: string) {
    this.logger.debug('<validate.game> event is triggered!');
    const game = await this.gameRepository.find(gameId);
    if (!game) return;
    // 게임이 시작되었으면 return
    if (game.leftScore === -1 && game.rightScore === -1)
      return await this.gameRepository.delete(gameId);
    // 둘 중 하나만 준비했다면 준비한 사람이 승리
  }
}
