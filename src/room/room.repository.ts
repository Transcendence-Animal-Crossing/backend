import { Room } from "./data/room.data";
import { Injectable } from "@nestjs/common";

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
  joinRoom(userId: number, roomId: string) {
    const room = this.rooms.find((room) => room.id === roomId);
    if (!room) throw new Error(`There is no room under id ${roomId}`);

    if (room.participantIds.includes(userId)) return;
    room.participantIds.push(userId);
  }
  kickUser(targetId: number, roomId: string) {
    const room = this.rooms.find((room) => room.id === roomId);
    if (!room) throw new Error(`There is no room under id ${roomId}`);

    if (!room.participantIds.includes(targetId)) return;
    room.participantIds = room.participantIds.filter((id) => id !== targetId);
  }

  leaveUser(userId: number, roomId: string) {
    const room = this.rooms.find((room) => room.id === roomId);
    if (!room) throw new Error(`There is no room under id ${roomId}`);

    if (!room.participantIds.includes(userId)) return;
    room.participantIds = room.participantIds.filter((id) => id !== userId);
  }
}
