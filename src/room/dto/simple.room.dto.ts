import { Room } from '../data/room.data';
import { UserData } from '../data/user.data';

export class SimpleRoomDto {
  private constructor(room: Room) {
    this.id = room.id;
    this.title = room.title;
    this.owner = UserData.compressToParticipant(room.participants[0]);
    this.headCount = room.participants.length;
    this.mode = room.mode;
  }
  id: string;
  title: string;
  owner: UserData;
  headCount: number;
  mode: string;

  public static from(room: Room): SimpleRoomDto {
    return new SimpleRoomDto(room);
  }
}
