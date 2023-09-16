import { ApiProperty } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({ description: '방 이름'})
  name: string;

  @ApiProperty({ description: '방장 id'})
  ownerId: number;
}
