import { Room } from '../model/room.model';
import { UserProfile } from '../../user/model/user.profile.model';

export class SimpleRoomDto {
  private constructor(room: Room) {
    this.id = room.id;
    this.title = room.title;
    this.owner = UserProfile.fromParticipant(room.participants[0]);
    this.headCount = room.participants.length;
    this.mode = room.mode;
  }
  id: string;
  title: string;
  owner: UserProfile;
  headCount: number;
  mode: string;

  public static from(room: Room): SimpleRoomDto {
    return new SimpleRoomDto(room);
  }
}
