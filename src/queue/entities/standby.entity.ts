import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Standby {
  @PrimaryColumn()
  id: number;

  @Column()
  isRank: boolean;

  @Column()
  isSpecial: boolean;

  @UpdateDateColumn()
  updatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  constructor(id: number, isRank: boolean, isSpecial: boolean) {
    this.id = id;
    this.isRank = isRank;
    this.isSpecial = isSpecial;
  }

  static create(id: number, isRank: boolean, isSpecial: boolean) {
    return new Standby(id, isRank, isSpecial);
  }
}
