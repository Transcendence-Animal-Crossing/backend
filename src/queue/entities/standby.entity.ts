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

  @UpdateDateColumn()
  updatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  constructor(id: number, type: GameType) {
    this.id = id;
    this.type = type;
  }

  static create(id: number, type: GameType) {
    return new Standby(id, type);
  }
}
