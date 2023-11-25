import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { GameHistory } from './entities/game-history.entity';
import { CreateGameDto } from './dto/create-game.dto';
import { GameRecord } from '../gameRecord/entities/game-record';
import { PAGINATION_LIMIT } from 'src/common/constants';
import { GameType } from './enum/game.type.enum';

@Injectable()
export class GameHistoryService {
  constructor(
    @InjectRepository(GameHistory)
    private readonly gameHistoryRepository: Repository<GameHistory>,
    @InjectRepository(GameRecord)
    private readonly gameRecordRepository: Repository<GameRecord>,
  ) {}

  async findAll(): Promise<GameHistory[]> {
    return this.gameHistoryRepository.find();
  }

  async findByUserId(id: number) {
    return this.gameHistoryRepository.find({
      where: [{ winner: { id: id } }, { loser: { id: id } }],
    });
  }

  async createGame(createGameDto: CreateGameDto) {
    try {
      await this.gameHistoryRepository.save(createGameDto);
    } catch (error) {
      throw new HttpException(
        'Failed to generate game data',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getAllGamesById(id: number, type: GameType, offset: number) {
    const games = await this.gameHistoryRepository
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
      .where('(loser.id = :id OR winner.id = :id) AND game.type = :type', {
        id,
        type,
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
