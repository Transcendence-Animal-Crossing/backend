import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameRecord } from './entities/game-record';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { PAGINATION_LIMIT } from 'src/common/constants';
import { GameType } from '../game/enum/game.type.enum';

@Injectable()
export class GameRecordService {
  constructor(
    @InjectRepository(GameRecord)
    private readonly gameRecordRepository: Repository<GameRecord>,
  ) {}

  async getRanking(offset: number) {
    const rankingData = await this.gameRecordRepository
      .createQueryBuilder('gameRecord')
      .innerJoinAndSelect('gameRecord.user', 'user')
      .select([
        'user.id',
        'user.nickName',
        'user.intraName',
        'gameRecord.rankScore',
        'user.avatar',
        'gameRecord.rankTotalCount',
      ])
      .orderBy('gameRecord.rankScore', 'DESC')
      .offset(offset)
      .limit(PAGINATION_LIMIT)
      .getMany();
    const ranking = rankingData.map((record, index) => ({
      id: record.user.id,
      nickName: record.user.nickName,
      intraName: record.user.intraName,
      rankScore: record.rankScore,
      avatar: record.user.avatar,
      rankGameTotalCount: record.rankTotalCount,
      ranking: offset + index + 1,
    }));
    return ranking;
  }

  async initGameRecord(user: User) {
    await this.gameRecordRepository.save(GameRecord.create(user));
  }

  async updateGameRecord(winnerId: number, loserId: number, type: GameType) {
    const winnerGameRecord = await this.gameRecordRepository.findOne({
      where: {
        user: { id: winnerId },
      },
    });

    const loserGameRecord = await this.gameRecordRepository.findOne({
      where: {
        user: { id: loserId },
      },
    });

    if (type === GameType.RANK) {
      await this.updateRankRecord(winnerGameRecord, loserGameRecord);
    } else {
      await this.updateGeneralRecord(winnerGameRecord, loserGameRecord);
    }
  }

  async updateRankRecord(
    winnerGameRecord: GameRecord,
    loserGameRecord: GameRecord,
  ) {
    await this.gameRecordRepository.update(winnerGameRecord.id, {
      rankTotalCount: () => 'rankTotalCount + 1',
      rankWinCount: () => 'rankWinCount + 1',
    });
    await this.gameRecordRepository.update(loserGameRecord.id, {
      rankTotalCount: () => 'rankTotalCount + 1',
    });
  }

  async updateGeneralRecord(
    winnerGameRecord: GameRecord,
    loserGameRecord: GameRecord,
  ) {
    await this.gameRecordRepository.update(winnerGameRecord.id, {
      generalTotalCount: () => 'generalTotalCount + 1',
      generalWinCount: () => 'generalWinCount + 1',
    });
    await this.gameRecordRepository.update(loserGameRecord.id, {
      generalTotalCount: () => 'generalTotalCount + 1',
    });
  }

  async findOneById(id: number) {
    return await this.gameRecordRepository.findOne({
      where: {
        user: { id: id },
      },
    });
  }

  async findRecord(id: number, isRank: boolean) {
    const gameRecord = await this.findOneById(id);
    if (!gameRecord)
      throw new HttpException('gamerecord not found', HttpStatus.NOT_FOUND);
    let winRate;

    if (isRank) {
      winRate =
        gameRecord.rankTotalCount > 0
          ? Math.round(
              (gameRecord.rankWinCount / gameRecord.rankTotalCount) * 100,
            )
          : 0;

      return {
        rankTotalCount: gameRecord.rankTotalCount,
        rankWinCount: gameRecord.rankWinCount,
        rankWinRate: winRate,
      };
    } else {
      winRate =
        gameRecord.generalTotalCount > 0
          ? Math.round(
              (gameRecord.generalWinCount / gameRecord.generalTotalCount) * 100,
            )
          : 0;

      return {
        generalTotalCount: gameRecord.generalTotalCount,
        generalWinCount: gameRecord.generalWinCount,
        generalWinRate: winRate,
      };
    }
  }
}
