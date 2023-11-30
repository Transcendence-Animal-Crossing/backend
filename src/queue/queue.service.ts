import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JoinQueueDto } from './dto/join-queue.dto';
import { DataSource } from 'typeorm';
import { Standby } from './entities/standby.entity';
import { GameRecordService } from '../gameRecord/game-record.service';
import { MutexManager } from '../mutex/mutex.manager';
import { DeleteResult } from 'typeorm/query-builder/result/DeleteResult';
import { GameRepository } from '../game/game.repository';

@Injectable()
export class QueueService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly mutexManager: MutexManager,
    private readonly gameRepository: GameRepository,
    private readonly gameRecordService: GameRecordService,
  ) {}

  async join(userId: number, dto: JoinQueueDto) {
    await this.dataSource.transaction('READ COMMITTED', async (manager) => {
      if (await this.findStandby(manager, userId))
        throw new HttpException('이미 대기열에 있습니다.', HttpStatus.CONFLICT);
      if (await this.gameRepository.findGameIdByUserId(userId))
        throw new HttpException('이미 게임 중 입니다.', HttpStatus.CONFLICT);
      await this.joinQueue(manager, userId, dto);
    });
  }

  async leave(userId: number) {
    await this.dataSource.transaction('READ COMMITTED', async (manager) => {
      const standby = await this.findStandby(manager, userId);
      if (!standby)
        throw new HttpException(
          '대기열에 유저가 없습니다.',
          HttpStatus.NOT_FOUND,
        );
      await this.mutexManager
        .getMutex('queue' + standby.type)
        .runExclusive(async () => {
          const deleteResult: DeleteResult = await manager
            .getRepository(Standby)
            .delete(userId);
          if (deleteResult.affected === 0)
            throw new HttpException(
              '이미 매칭이 성사되었습니다.',
              HttpStatus.NOT_FOUND,
            );
        });
    });
  }

  private async findStandby(manager, userId: number): Promise<Standby> {
    return await manager.findOneBy(Standby, { id: userId });
  }

  // private async isAlreadyInGame(manager, user: number) {
  //   return false;
  // }

  private async joinQueue(manager, userId: number, dto: JoinQueueDto) {
    const gameRecord = await this.gameRecordService.findOneById(userId);
    manager.save(Standby.create(userId, dto.type, gameRecord.rankScore));
  }
}
