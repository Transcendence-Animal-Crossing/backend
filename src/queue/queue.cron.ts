import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, ObjectLiteral } from 'typeorm';
import { Standby } from './entities/standby.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { QueueGateway } from './queue.gateway';
import { ClientService } from '../ws/client.service';
import { Namespace } from '../ws/const/namespace';
import { GameService } from '../game/game.service';

@Injectable()
export class QueueCron {
  constructor(
    private readonly dataSource: DataSource,
    private readonly queueGateWay: QueueGateway,
    private readonly clientService: ClientService,
    private readonly gameService: GameService,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async matchCron(): Promise<void> {
    await this.dataSource.transaction('READ COMMITTED', async (manager) => {
      await this.match(manager, true, true);
      await this.match(manager, true, false);
      await this.match(manager, false, true);
      await this.match(manager, false, false);
    });
  }

  private async match(
    manager: EntityManager,
    isRank: boolean,
    isSpecial: boolean,
  ) {
    const queue = await manager
      .getRepository(Standby)
      .createQueryBuilder('standby')
      .select('standby.id')
      .where('standby.isRank = :isRank', { isRank })
      .andWhere('standby.isSpecial = :isSpecial', { isSpecial })
      .orderBy('standby.createdAt', 'ASC')
      .getMany();

    while (queue.length >= 2) {
      if (isRank) await this.generalMatch(manager, queue);
      else await this.rankMatch(manager, queue);
    }
  }

  private async generalMatch(manager: EntityManager, queue: ObjectLiteral[]) {
    while (queue.length >= 2) {
      const matched = queue.splice(0, 2);
      const game = await this.gameService.initGame(
        matched[0].isRank,
        matched[0].isSpecial,
      );
      for (const user of matched) {
        const client = await this.clientService.getClientByUserId(
          Namespace.QUEUE,
          user.id,
        );
        this.queueGateWay.server
          .to(client)
          .emit('game-matched', { id: game.id });
      }
      await manager.getRepository(Standby).remove(matched);
    }
  }

  private async rankMatch(manager: EntityManager, queue: ObjectLiteral[]) {

  }
}
