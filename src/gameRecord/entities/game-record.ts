import { User } from 'src/user/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class GameRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  rankTotalCount: number;

  @Column()
  rankWinCount: number;

  @Column()
  generalTotalCount: number;

  @Column()
  generalWinCount: number;

  @Column()
  rankScore: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;

  static create(user: User): GameRecord {
    const gameRecord = new GameRecord();
    gameRecord.rankScore = 1000;
    gameRecord.generalTotalCount = 0;
    gameRecord.generalWinCount = 0;
    gameRecord.rankTotalCount = 0;
    gameRecord.rankWinCount = 0;
    gameRecord.user = user;
    return gameRecord;
  }
}
