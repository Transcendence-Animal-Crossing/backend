import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GameType } from '../../game/const/game.type';

@Entity()
export class Standby {
  @PrimaryColumn()
  id: number;

  @Column()
  type: GameType;

  @Column()
  rankScore: number;

  @UpdateDateColumn()
  updatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  constructor(id: number, type: GameType, rankScore: number) {
    this.id = id;
    this.type = type;
    this.rankScore = rankScore;
  }

  static create(id: number, type: GameType, rankScore: number) {
    return new Standby(id, type, rankScore);
  }
}
