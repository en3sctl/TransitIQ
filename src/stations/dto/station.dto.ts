import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateStationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsNumber()
  @IsOptional()
  locationLat?: number;

  @IsNumber()
  @IsOptional()
  locationLng?: number;
}

export class UpdateStationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsNumber()
  @IsOptional()
  locationLat?: number;

  @IsNumber()
  @IsOptional()
  locationLng?: number;
}
