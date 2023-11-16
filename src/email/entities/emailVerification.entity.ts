import { User } from 'src/user/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';

@Entity()
export class EmailVerification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;

  @Column()
  emailToken: string;

  @Column()
  timestamp: Date;

  static create(email: string, user: User): EmailVerification {
    const emailVerification = new EmailVerification();
    emailVerification.email = email;
    emailVerification.emailToken = '';
    emailVerification.timestamp = new Date();
    emailVerification.user = user;
    return emailVerification;
  }
}
