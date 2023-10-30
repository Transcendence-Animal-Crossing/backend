import { Injectable, Logger } from '@nestjs/common';
import { UserService } from './user/user.service';

@Injectable()
export class AppService {
  constructor(private readonly userService: UserService) {}

  private readonly logger: Logger = new Logger(AppService.name);

  init() {
    /*
    try {
      for (let i = 0; i < 10; i++) {
        await this.userService.createOrUpdateUser({
          id: i,
          login: 'tester' + i,
        });
      }
    } catch (e) {
      this.logger.log('Application Init Fail by ' + e);
      return;
    }
     */
    this.logger.log('Application Init Success');
  }
}
