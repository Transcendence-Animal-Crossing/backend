import { DataSource } from 'typeorm';
import { Game } from './game.entity';

export const gameProviders = [
  {
    provide: 'GAME_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Game),
    inject: ['DATA_SOURCE'],
  },
];
