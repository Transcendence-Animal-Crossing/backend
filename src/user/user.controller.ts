import { Controller, Get, Param } from '@nestjs/common';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}
  @Get(':id')
  findOnyById(@Param('id') id: number): Promise<User | null> {
    return this.userService.findOne(id);
  }
}
