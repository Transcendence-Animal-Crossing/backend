import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { UserService } from 'src/user/user.service';

import { Room } from './entities/room.entity';
import { Message } from './entities/message.entity';

import { AddMessageDto } from 'src/chat/dto/add-message.dto';
import { CreateRoomDto } from 'src/room/dto/create-room.dto';
import { Participant } from "./entities/participant.entity";
import { User } from "../user/entities/user.entity";

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room) private readonly roomRepository: Repository<Room>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
    private readonly userService: UserService,
  ) {}

  async findAll() {
    const rooms = await this.roomRepository.find({
      relations: ['participants'],
    });

    return rooms;
  }

  async findById(id: number) {
    // const room = await this.roomRepository.findOne(id, {
    //   relations: ['participants'],
    // });
    const room = await this.roomRepository.findOne({
      where: { id: id },
      relations: ['participants'],
    });
    if (!room) {
      throw new NotFoundException(`There is no room under id ${id}`);
    }

    return room;
  }

  // async findByOwnerId(id: string) {
  //   const rooms = await this.roomRepository.findBy({ ownerId: id });
  //   if (!rooms) throw new NotFoundException(`There is no room under id ${id}`);
  //
  //   return rooms;
  // }

  async create(name: string, ownerId: number) {
    const room = new Room(name, ownerId);
    const owner = await this.userService.findOne(ownerId);
    const participant = new Participant(owner, room);

    room.participants = [];
    room.participants.push(participant);
    if (!owner.participants) owner.participants = [];
    owner.participants.push(participant);

    await this.roomRepository.save(room);
    await this.userRepository.save(owner);
    await this.participantRepository.save(participant);

    return this.roomRepository.save(room);
  }

  async addMessage(userId: number, roomId: number, text: string) {
    const room = await this.findById(roomId);
    const user = await this.userService.findOne(userId);
    const message: Message = await this.messageRepository.create({
      text,
      room,
      user,
    });
    console.log('message: ' + message);
    return await this.messageRepository.save(message);
  }

  async joinRoom(user: User, room: Room) {
    if (
      await this.participantRepository.findOne({
        where: { user: user, room: room },
      })
    )
      throw new ConflictException(`You are already a member of this room!`);
    const participant = new Participant(user, room);
    room.participants.push(participant);
    user.participants.push(participant);

    await this.roomRepository.save(room);
    await this.userRepository.save(user);
    await this.participantRepository.save(participant);
  }

  // async update(id: string, updateRoomDto: UpdateRoomDto) {
  //   const room = await this.roomRepository.preload({
  //     id,
  //     ...updateRoomDto,
  //   });
  //
  //   if (!room) {
  //     throw new NotFoundException(`There is no room under id ${id}`);
  //   }
  //
  //   return this.roomRepository.save(room);
  // }

  // async banUserFromRoom(banUserDto: BanUserDto) {
  //   const { userId, roomId } = banUserDto;
  //
  //   const user = await this.userService.findOne(userId);
  //   const room = await this.findOne(roomId);
  //
  //   await this.userService.updateUserRoom(userId, null);
  //
  //   const bannedUsers = { ...room.bannedUsers, ...user };
  //   const updatedRoom = await this.roomRepository.preload({
  //     id: roomId,
  //     bannedUsers,
  //   });
  //
  //   return this.roomRepository.save(updatedRoom);
  // }

  // async remove(id: string) {
  //   const room = await this.findById(id);
  //
  //   return this.roomRepository.remove(room);
  // }
}
