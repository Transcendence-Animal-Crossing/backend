import { Injectable } from '@nestjs/common';
import { Mutex } from 'async-mutex';

@Injectable()
export class MutexManager {
  private mutexes: { [key: string]: Mutex } = {};

  public getMutex(name: string): Mutex {
    if (!this.mutexes[name]) {
      this.mutexes[name] = new Mutex();
    }

    return this.mutexes[name];
  }

  public async runExclusive<T>(
    name: string,
    callback: () => Promise<T>,
  ): Promise<T> {
    const mutex = this.getMutex(name);

    return await mutex.runExclusive(callback);
  }
}
