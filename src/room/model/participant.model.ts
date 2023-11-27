import { User } from '../../user/entities/user.entity';
import { UserProfile } from '../../user/model/user.profile.model';

export class Participant extends UserProfile {
  private constructor(user: User, grade: number) {
    super(user.id, user.nickName, user.intraName, user.avatar);
    this.grade = grade;
    this.mute = false;
    this.joinTime = new Date();
    this.adminTime = new Date();
  }
  grade: number;
  mute: boolean;
  joinTime: Date;
  adminTime: Date;

  public static of(user: User, grade: number): Participant {
    return new Participant(user, grade);
  }
}
