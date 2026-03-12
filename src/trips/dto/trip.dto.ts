import { IsString, IsNotEmpty, IsISO8601, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTripDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  routeId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  vehicleId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  driverId: string;

  @ApiProperty()
  @IsISO8601()
  @IsNotEmpty()
  departureTime: string;

  @ApiProperty({ required: false })
  @IsISO8601()
  @IsOptional()
  endTime?: string;
}
