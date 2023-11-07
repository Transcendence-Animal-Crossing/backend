import { GameRecord } from 'src/gameRecord/entities/game-record';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryColumn()
  id: number;

  @Column()
  password: string;

  @Column()
  nickName: string;

  @Column()
  intraName: string;

  @Column()
  avatar: string;

  @Column()
  two_factor_auth: boolean;

  @Column('text', { array: true, nullable: true })
  achievements: string[];

  @Column('int', { array: true, nullable: true })
  blockIds: number[];

  @OneToOne(() => GameRecord, (gameRecord) => gameRecord.user)
  gameRecord: GameRecord;
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  static create(data: any): User {
    const user = new User();
    user.id = data.id;
    user.password = '';
    user.nickName = data.login;
    user.intraName = data.login;
    user.avatar = 'original/profile2.png';
    user.two_factor_auth = false;
    user.achievements = [];
    user.blockIds = [];
    return user;
  }
}
