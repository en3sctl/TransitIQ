import { IsString, IsNotEmpty, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatDto {
  @ApiProperty({ description: 'Kullanıcı mesajı (max 2000 karakter)' })
  @IsString()
  @IsNotEmpty({ message: 'Mesaj boş olamaz' })
  @MaxLength(2000, { message: 'Mesaj 2000 karakteri aşamaz' })
  message: string;
}

export class SuggestPriceDto {
  @ApiProperty()
  @IsUUID('4', { message: 'Geçersiz route ID' })
  routeId: string;

  @ApiProperty()
  @IsUUID('4', { message: 'Geçersiz araç ID' })
  vehicleId: string;
}
