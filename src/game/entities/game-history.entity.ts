import { User } from 'src/user/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GameType } from '../enum/game.type.enum';

@Entity()
export class GameHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  winnerScore: number;

  @Column()
  loserScore: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'winnerId' })
  winner: User;

  @Column()
  winnerId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'loserId' })
  loser: User;

  @Column()
  loserId: number;

  @Column()
  playTime: number;

  @Column()
  type: GameType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  static create(
    winnerId: number,
    loserId: number,
    winnerScore: number,
    loserScore: number,
    playTime: number,
    type: GameType,
  ) {
    const game = new GameHistory();
    game.winnerId = winnerId;
    game.loserId = loserId;
    game.winnerScore = winnerScore;
    game.loserScore = loserScore;
    game.playTime = playTime;
    game.type = type;
    return game;
  }

  static init(type: GameType) {
    const game = new GameHistory();
    game.winnerId = 0;
    game.loserId = 0;
    game.winnerScore = 0;
    game.loserScore = 0;
    game.playTime = 0;
    game.type = type;
    return game;
  }
}
