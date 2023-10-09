import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from '../auth.service';
import { Strategy } from 'passport-local';
import { LoginUserDto } from 'src/user/dto/login-user.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async validate(userDto: LoginUserDto) {
    const user = this.authService.validateUser(userDto);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
