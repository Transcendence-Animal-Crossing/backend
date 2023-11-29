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

  @Column({ name: 'rank_total_count' })
  rankTotalCount: number;

  @Column({ name: 'rank_win_count' })
  rankWinCount: number;

  @Column({ name: 'general_total_count' })
  generalTotalCount: number;

  @Column({ name: 'general_win_count' })
  generalWinCount: number;

  @Column({ name: 'rank_score' })
  rankScore: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;

  static create(user: User): GameRecord {
    const gameRecord = new GameRecord();
    gameRecord.rankScore = 999;
    gameRecord.generalTotalCount = 0;
    gameRecord.generalWinCount = 0;
    gameRecord.rankTotalCount = 0;
    gameRecord.rankWinCount = 0;
    gameRecord.user = user;
    return gameRecord;
  }
}
