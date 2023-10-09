import { IsString } from 'class-validator';

export class LoginUserDto {
  @IsString()
  intraName: string;

  @IsString()
  password: string;
}
