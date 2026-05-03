import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, MaxLength, Min, Max, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApplyReferralDto {
  @ApiProperty({ description: 'Referans kodu (alfanumerik, 4-20 karakter)' })
  @IsString()
  @IsNotEmpty({ message: 'Kod gerekli' })
  @Matches(/^[A-Z0-9]{4,20}$/i, { message: 'Geçersiz kod formatı' })
  code: string;
}

export class CreatePriceAlertDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Kalkış şehri gerekli' })
  @MaxLength(100)
  originCity: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Varış şehri gerekli' })
  @MaxLength(100)
  destinationCity: string;

  @ApiProperty({ description: 'Maks fiyat (TL)' })
  @IsNumber({}, { message: 'Maks fiyat sayı olmalı' })
  @Min(1, { message: 'Maks fiyat 1 TL\'den az olamaz' })
  @Max(10000, { message: 'Maks fiyat 10000 TL\'den fazla olamaz' })
  maxPrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyEmail?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifySms?: boolean;
}
