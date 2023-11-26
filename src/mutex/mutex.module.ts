import { Module } from '@nestjs/common';
import { MutexManager } from './mutex.manager';

@Module({
  providers: [MutexManager],
  exports: [MutexManager],
})
export class MutexModule {}
