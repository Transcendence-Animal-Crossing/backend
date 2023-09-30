import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../user/entities/user.entity';

@Entity()
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  date: Date;

  @Column()
  winnerScore: number;

  @Column()
  loserScore: number;

  @ManyToOne(() => User)
  winner: User;

  @ManyToOne(() => User)
  loser: User;

  @Column()
  playTime: number;

  @Column()
  isRank: boolean;
}
