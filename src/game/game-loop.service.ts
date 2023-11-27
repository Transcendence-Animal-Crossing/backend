import { Injectable } from '@nestjs/common';
import { MutexManager } from 'src/mutex/mutex.manager';

@Injectable()
export class GameLoopService {
  constructor(private readonly mutexManager: MutexManager) {}
}
