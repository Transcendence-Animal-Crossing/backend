import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { ResponseUserDto } from './dto/response-user.dto';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}
  @Get(':id')
  findOnyById(@Param('id') id: number): Promise<ResponseUserDto> {
    return this.userService.findOneById(id);
  }
}
