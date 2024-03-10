import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RoomUser } from './room-user.model';

@Entity()
export class Room {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  title: string;

  @Column()
  mode: string;

  @Column()
  password: string;

  @OneToMany(() => RoomUser, (roomUser) => roomUser.room)
  roomUsers: RoomUser[];

  private constructor(title: string, mode: string, password: string) {
    this.title = title;
    this.mode = mode;
    this.password = password;
  }

  public static create(title: string, mode: string, password: string): Room {
    return new Room(title, mode, password);
  }

  // isParticipant(userId): boolean {
  //   return this.participants.some((participant) => participant.id === userId);
  // }

  // isBanned(userId): boolean {
  //   return this.bannedUsers.some((bannedUser) => bannedUser.id === userId);
  // }

  isProtected(): boolean {
    return this.mode === 'PROTECTED';
  }

  isPrivate(): boolean {
    return this.mode === 'PRIVATE';
  }

  validatePassword(password: string): boolean {
    return this.password === password;
  }
  /*

  isInvited(userId): boolean {
    return this.invitedUsers.some((invitedUser) => invitedUser.id === userId);
  }

  findUserGrade(userId: number): Grade {
    for (const participant of this.participants) {
      if (participant.id === userId) {
        return participant.grade;
      }
    }
    return null;
  }

  promoteUser(userId: number): void {
    for (const participant of this.participants) {
      if (participant.id === userId) {
        participant.grade = Grade.ADMIN;
        return;
      }
    }
  }

  demoteUser(userId: number): void {
    for (const participant of this.participants) {
      if (participant.id === userId) {
        participant.grade = Grade.PARTICIPANT;
        return;
      }
    }
  }

  inviteUser(user: User): void {
    for (const invitedUser of this.invitedUsers) {
      if (invitedUser.id === user.id) return;
    }
    this.invitedUsers.push(UserProfile.fromUser(user));
  }

  muteUser(userId: number): void {
    for (const participant of this.participants) {
      if (participant.id === userId) {
        participant.mute = true;
        return;
      }
    }
  }

  unmuteUser(userId: number): void {
    for (const participant of this.participants) {
      if (participant.id === userId) {
        participant.mute = false;
        return;
      }
    }
  }

  leaveUser(userId: number): Participant[] {
    for (let i = 0; i < this.participants.length; i++) {
      if (this.participants[i].id === userId) {
        return this.participants.splice(i, 1);
      }
    }
  }

  sortParticipants(): void {
    this.participants.sort((a, b) => {
      if (a.grade > b.grade) return -1;
      else if (a.grade < b.grade) return 1;
      else {
        if (a.grade === Grade.ADMIN) {
          if (a.adminTime > b.adminTime) return -1;
          else if (a.adminTime < b.adminTime) return 1;
          else return 0;
        } else {
          if (a.joinTime > b.joinTime) return -1;
          else if (a.joinTime < b.joinTime) return 1;
          else return 0;
        }
      }
    });
  }

  isMuted(targetId: number) {
    for (const participant of this.participants) {
      if (participant.id === targetId) {
        return participant.mute;
      }
    }
    return false;
  }

  unbanUser(targetId: number) {
    for (let i = 0; i < this.bannedUsers.length; i++) {
      if (this.bannedUsers[i].id === targetId) {
        this.bannedUsers.splice(i, 1);
        return;
      }
    }
  }
   */
}
