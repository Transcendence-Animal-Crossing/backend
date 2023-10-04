import { Room } from "./data/room.data";
import { Injectable } from "@nestjs/common";
import { User } from '../user/entities/user.entity';
import { UserData } from './data/user.data';
import { ParticipantData } from './data/participant.data';

@Injectable()
export class RoomRepository {
  private rooms: Room[];
  constructor() {
    this.rooms = [];
  }
  findAll() {
    return this.rooms;
  }
  save(room) {
    this.rooms.push(room);
    console.log(this.rooms);
  }
  find(id) {
    return this.rooms.find((room) => room.id === id);
  }
  update(room) {
    this.rooms = this.rooms.map((r) => (r.id === room.id ? room : r));
  }
  delete(id) {
    this.rooms = this.rooms.filter((room) => room.id !== id);
  }
  joinRoom(user: User, room: Room) {
    room.participants.push(new ParticipantData(user, 0));
  }
}
