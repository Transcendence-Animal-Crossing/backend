import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { CreateGameDto } from './dto/create-game.dto';
import { GameRecord } from '../gameRecord/entities/game-record';
import { PAGINATION_LIMIT } from 'src/common/constants';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Game) private readonly gameRepository: Repository<Game>,
    @InjectRepository(GameRecord)
    private readonly gameRecordRepository: Repository<GameRecord>,
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

  async getAllGamesById(id: number, isRank: boolean, offset: number) {
    const games = await this.gameRepository
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.loser', 'loser')
      .leftJoinAndSelect('game.winner', 'winner')
      .select([
        'game.id',
        'game.winnerScore',
        'game.loserScore',
        'game.playTime',
        'winner.id',
        'winner.nickName',
        'winner.intraName',
        'winner.avatar',
        'loser.id',
        'loser.nickName',
        'loser.intraName',
        'loser.avatar',
      ])
      .where('(loser.id = :id OR winner.id = :id) AND game.isRank = :isRank', {
        id,
        isRank,
      })
      .orderBy('game.id', 'DESC')
      .offset(offset)
      .limit(PAGINATION_LIMIT)
      .getMany();

    return {
      games,
    };
  }
}
