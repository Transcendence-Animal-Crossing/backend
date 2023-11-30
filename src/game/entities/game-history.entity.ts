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
import { Game } from '../model/game.model';

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

  private constructor() {}

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

  static from(game: Game) {
    if (game.leftScore > game.rightScore) {
      return GameHistory.create(
        game.leftUser.id,
        game.rightUser.id,
        game.leftScore,
        game.rightScore,
        game.getPlayTime(),
        game.type,
      );
    }
    return GameHistory.create(
      game.rightUser.id,
      game.leftUser.id,
      game.rightScore,
      game.leftScore,
      game.getPlayTime(),
      game.type,
    );
  }
}
