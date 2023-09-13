import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Game } from './game.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Game) private readonly gameRepository: Repository<Game>,
  ) {}

  async findAll(): Promise<Game[]> {
    return this.gameRepository.find();
  }

  async findById(id: number): Promise<Game> {
    return this.gameRepository.findOneBy({ id: id });
  }

  async create(game: Game): Promise<Game> {
    return this.gameRepository.save(game);
  }
}
