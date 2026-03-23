import { IsString, IsNotEmpty, IsDateString, IsUUID, IsArray, ArrayMinSize, ArrayMaxSize, ValidateNested, IsEmail, Matches, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchTripsDto {
  @IsString()
  @IsNotEmpty()
  startLocation: string;

  @IsString()
  @IsNotEmpty()
  endLocation: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsUUID()
  @IsOptional()
  tenantId?: string;
}


export class PassengerDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{11}$/, { message: 'TC Kimlik No must be exactly 11 digits' })
  tcKimlik: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsUUID()
  @IsNotEmpty()
  seatId: string;
}

export class CreateReservationDto {
  @IsUUID()
  @IsNotEmpty()
  tripId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => PassengerDto)
  passengers: PassengerDto[];

  @IsEmail()
  @IsNotEmpty()
  contactEmail: string;

  @IsString()
  @IsNotEmpty()
  contactPhone: string;
}

export class LockSeatsDto {
  @IsUUID()
  @IsNotEmpty()
  tripId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @IsUUID('4', { each: true })
  seatIds: string[];
}
