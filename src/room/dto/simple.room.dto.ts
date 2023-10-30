import { Room } from '../data/room.data';
import { UserData } from '../data/user.data';

export class SimpleRoomDto {
  constructor(room: Room) {
    this.id = room.id;
    this.title = room.title;
    this.owner = UserData.compressParticipant(room.participants[0]);
    this.headCount = room.participants.length;
    this.mode = room.mode;
  }
  id: string;
  title: string;
  owner: UserData;
  headCount: number;
  mode: string;
}
