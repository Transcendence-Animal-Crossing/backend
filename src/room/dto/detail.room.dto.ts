import { Room } from '../model/room.model';
import { UserProfile } from '../../user/model/user.profile.model';
import { Participant } from '../model/room-user.model';

export class DetailRoomDto {
  private constructor(room: Room) {
    this.id = room.id;
    this.title = room.title;
    this.participants = room.participants;
    this.bannedUsers = room.bannedUsers;
    this.invitedUsers = room.invitedUsers;
    this.mode = room.mode;
  }
  id: string;
  title: string;
  participants: Participant[];
  bannedUsers: UserProfile[];
  invitedUsers: UserProfile[];
  mode: string;

  public static from(room: Room): DetailRoomDto {
    return new DetailRoomDto(room);
  }
}
