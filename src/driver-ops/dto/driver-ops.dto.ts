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
  @Min(0)
  amount: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  category: string; // e.g., TOLL, FUEL, OTHER
}
