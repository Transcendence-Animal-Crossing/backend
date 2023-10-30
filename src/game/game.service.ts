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

  async createGame(createGameDto: CreateGameDto) {
    try {
      await this.gameRepository.save(createGameDto);
    } catch (error) {
      throw new HttpException(
        'Failed to generate game data',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getAllGamesById(id: number, isRank: boolean) {
    const games = await this.gameRepository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.loser', 'loser')
      .leftJoinAndSelect('game.winner', 'winner')
      .select([
        'game.id',
        'game.winnerScore',
        'game.loserScore',
        'game.playTime',
        'game.updatedAt',
        'winner.id',
        'winner.nickName',
        'winner.intraName',
        'loser.id',
        'loser.nickName',
        'loser.intraName',
      ])
      .where('(loser.id = :id OR winner.id = :id) AND game.isRank = :isRank', {
        id,
        isRank,
      })
      .orderBy('game.updatedAt', 'DESC')
      .getMany();

    const totalWins = games.filter((game) => game.winner.id === id).length;

    const totalGames = games.length;
    const winRate = totalGames === 0 ? 0 : (totalWins / totalGames) * 100;

    return {
      games,
      stats: {
        totalGames,
        totalWins,
        winRate,
      },
    };
  }
}
