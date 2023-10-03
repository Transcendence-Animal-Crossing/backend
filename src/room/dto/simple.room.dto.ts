import { Room } from '../data/room.data';
import { UserData } from '../data/user.data';

export class SimpleRoomDto {
  constructor(room: Room) {
    this.id = room.id;
    this.title = room.title;
    this.owner = room.owner;
    this.headCount = room.participants.length;
    this.isLocked = room.isLocked;
  }
  id: string;
  title: string;
  owner: UserData;
  headCount: number;
  isLocked: boolean;
}
