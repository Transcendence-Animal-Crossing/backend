import { Room } from '../data/room.data';
import { UserData } from '../data/user.data';
import { ParticipantData } from '../data/participant.data';

export class DetailRoomDto {
  constructor(room: Room) {
    this.id = room.id;
    this.title = room.title;
    this.participants = room.participants;
    this.bannedUsers = room.bannedUsers;
    this.invitedUsers = room.invitedUsers;
    this.isPrivate = room.isPrivate;
    this.isLocked = room.isLocked;
  }
  id: string;
  title: string;
  participants: ParticipantData[];
  bannedUsers: UserData[];
  invitedUsers: UserData[];
  isPrivate: boolean;
  isLocked: boolean;
}
