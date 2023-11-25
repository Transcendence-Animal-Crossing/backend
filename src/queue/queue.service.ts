import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JoinQueueDto } from './dto/join-queue.dto';
import { DataSource } from 'typeorm';
import { Standby } from './entities/standby.entity';
import { GameRecordService } from '../gameRecord/game-record.service';

@Injectable()
export class QueueService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly gameRecordService: GameRecordService,
  ) {}

  async join(userId: number, dto: JoinQueueDto) {
    await this.dataSource.transaction('READ COMMITTED', async (manager) => {
      if (await this.isAlreadyInQueue(manager, userId))
        throw new HttpException('이미 대기열에 있습니다.', HttpStatus.CONFLICT);
      // if (await this.isAlreadyInGame(manager, userId)) return;
      await this.joinQueue(manager, userId, dto);
    });
  }

  async leave(userId: number) {
    await this.dataSource.transaction('READ COMMITTED', async (manager) => {
      if (!(await this.isAlreadyInQueue(manager, userId)))
        throw new HttpException(
          '대기열에 유저가 없습니다.',
          HttpStatus.NOT_FOUND,
        );

      await manager.getRepository(Standby).delete(userId);
    });
  }

  private async isAlreadyInQueue(manager, userId: number): Promise<boolean> {
    return !!(await manager.findOneBy(Standby, { id: userId }));
  }

  // private async isAlreadyInGame(manager, user: number) {
  //   return false;
  // }

  private async joinQueue(manager, userId: number, dto: JoinQueueDto) {
    const gameRecord = await this.gameRecordService.findOneById(userId);
    manager.save(Standby.create(userId, dto.type, gameRecord.rankScore));
  }
}
