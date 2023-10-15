import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { CreateGameDto } from './dto/create-game.dto';

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

  async create(createGameDto: CreateGameDto) {
    try {
      await this.gameRepository.save(createGameDto);
    } catch (error) {
      throw new HttpException(
        'Failed to generate game data',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findWinGamesById(id: number): Promise<Game[]> {
    const games = await this.gameRepository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.winner', 'winner')
      .where('winner.id = :id', {
        id,
      })
      .getMany();

    return games;
  }

  async findLoseGamesById(id: number): Promise<Game[]> {
    const games = await this.gameRepository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.loser', 'loser')
      .where('loser.id = :id', {
        id,
      })
      .getMany();

    return games;
  }
  async getAllGamesById(id: number) {
    const winGames = await this.findWinGamesById(id);
    const loseGames = await this.findLoseGamesById(id);

    const allGames = [...winGames, ...loseGames].sort((a, b) => {
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });

    const totalGames = allGames.length;
    const totalWins = winGames.length;
    const winRate = totalGames === 0 ? 0 : (totalWins / totalGames) * 100;

    return {
      allGames,
      stats: {
        totalGames,
        totalWins,
        winRate,
      },
    };
  }
}
