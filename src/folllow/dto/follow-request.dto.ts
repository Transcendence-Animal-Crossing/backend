import { IsNumber } from 'class-validator';

export class FollowRequestDto {
  @IsNumber()
  sendBy: number;

  @IsNumber()
  sendTo: number;
}
