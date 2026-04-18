import { IsString, IsNumber, IsEnum, IsNotEmpty, IsOptional, Min } from 'class-validator';
import { TripStatus } from '@prisma/client';

export class UpdateTripStatusDto {
  @IsEnum(TripStatus)
  status: TripStatus;
}

export class LocationDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  speed?: number;
}

export class CreateExpenseDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(['FUEL', 'TOLL', 'FOOD', 'PARKING', 'OTHER'])
  category: 'FUEL' | 'TOLL' | 'FOOD' | 'PARKING' | 'OTHER';
}
