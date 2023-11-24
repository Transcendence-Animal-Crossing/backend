import { DataSource } from 'typeorm';
import { GameHistory } from './entities/game-history.entity';

export const gameProviders = [
  {
    provide: 'GAME_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(GameHistory),
    inject: ['DATA_SOURCE'],
  },
];
