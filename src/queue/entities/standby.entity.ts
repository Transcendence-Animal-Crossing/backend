import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GameType } from '../../game/enum/game.type.enum';

@Entity()
export class Standby {
  @PrimaryColumn()
  id: number;

  @Column()
  type: GameType;

  @Column({ name: 'rank_score' })
  rankScore: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  constructor(id: number, type: GameType, rankScore: number) {
    this.id = id;
    this.type = type;
    this.rankScore = rankScore;
  }

  static create(id: number, type: GameType, rankScore: number) {
    return new Standby(id, type, rankScore);
  }

  static createWithDate(
    id: number,
    type: GameType,
    rankScore: number,
    createdAt: Date,
  ) {
    const standby = new Standby(id, type, rankScore);
    standby.createdAt = createdAt;
    return standby;
  }
}
