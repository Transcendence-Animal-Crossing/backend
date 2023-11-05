import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GameRecord } from './entities/game-record';
import { Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class GameRecordService {
  constructor(
    @InjectRepository(GameRecord)
    private readonly gameRecordRepository: Repository<GameRecord>,
  ) {}

  async getRanking() {
    const rankingData = await this.gameRecordRepository
      .createQueryBuilder('gameRecord')
      .innerJoinAndSelect('gameRecord.userId', 'user')
      .select([
        'user.id',
        'user.nickName',
        'user.intraName',
        'gameRecord.rankScore',
      ])
      .orderBy('gameRecord.rankScore', 'DESC')
      .getMany();
    console.log('rankingdata', rankingData);
    const ranking = rankingData.map((record) => ({
      id: record.userId.id,
      nickName: record.userId.nickName,
      intraName: record.userId.intraName,
      rankScore: record.rankScore,
    }));
    return ranking;
  }

  async initGameRecord(user: User) {
    await this.gameRecordRepository.save(GameRecord.create(user));
  }

  async updateGameRecord(winnerId: number, loserId: number, isRank: boolean) {
    const winnerGameRecord = await this.gameRecordRepository.findOne({
      where: {
        userId: { id: winnerId },
      },
    });

    const loserGameRecord = await this.gameRecordRepository.findOne({
      where: {
        userId: { id: loserId },
      },
    });

    if (isRank) {
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

  async findRecord(id: number, isRank: boolean) {
    const gameRecord = await this.gameRecordRepository.findOne({
      where: {
        userId: { id: id },
      },
    });

    if (isRank) {
      return (
        gameRecord.rankTotalCount,
        gameRecord.rankWinCount,
        Math.round((gameRecord.rankWinCount / gameRecord.rankTotalCount) * 100)
      );
    }
    return (
      gameRecord.generalTotalCount,
      gameRecord.generalWinCount,
      Math.round(
        (gameRecord.generalWinCount / gameRecord.generalTotalCount) * 100,
      )
    );
  }
}
