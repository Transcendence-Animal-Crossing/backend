import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { ResponseUserDto } from './dto/response-user.dto';
import { Public } from 'src/auth/guards/public';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('user')
//@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Public()
  @Get('all')
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOnyById(@Param('id') id: number): Promise<ResponseUserDto> {
    return this.userService.findOneById(id);
  }
}
