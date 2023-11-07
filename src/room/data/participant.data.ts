import { User } from '../../user/entities/user.entity';
import { UserData } from './user.data';

export class ParticipantData extends UserData {
  constructor(user: User, grade: number) {
    super(user);
    this.grade = grade;
    this.muteStartTime = null;
    this.joinTime = new Date();
    this.adminTime = new Date();
  }
  grade: number;
  muteStartTime: Date;
  joinTime: Date;
  adminTime: Date;
}
