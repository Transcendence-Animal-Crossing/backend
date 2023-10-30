import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ description: '기본키' })
  @IsString()
  intraName: string;
  @ApiProperty({ description: '비밀번호' })
  @IsString()
  password: string;
}
