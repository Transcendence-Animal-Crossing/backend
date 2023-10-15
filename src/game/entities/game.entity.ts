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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
