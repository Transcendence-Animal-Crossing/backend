import { Room } from '../data/room.data';
import { UserData } from '../data/user.data';
import { ParticipantData } from '../data/participant.data';

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
  participants: ParticipantData[];
  bannedUsers: UserData[];
  invitedUsers: UserData[];
  mode: string;

  public static from(room: Room): DetailRoomDto {
    return new DetailRoomDto(room);
  }
}
