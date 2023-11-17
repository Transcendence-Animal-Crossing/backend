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

@Entity()
export class Game {
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
  isRank: boolean;

  @Column()
  isSpecial: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  static init(isRank: boolean, isSpecial: boolean) {
    const game = new Game();
    game.winnerId = 0;
    game.loserId = 0;
    game.winnerScore = 0;
    game.loserScore = 0;
    game.playTime = 0;
    game.isRank = isRank;
    game.isSpecial = isSpecial;
    return game;
  }
}
