import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsUUID } from 'class-validator';

export class CreateRouteDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsUUID()
  @IsNotEmpty()
  originStationId: string;

  @IsUUID()
  @IsNotEmpty()
  destinationStationId: string;

  @IsNumber()
  @Min(0)
  basePrice: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  totalDistanceKm?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  taxRate?: number;
}

export class UpdateRouteDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsUUID()
  @IsOptional()
  originStationId?: string;

  @IsUUID()
  @IsOptional()
  destinationStationId?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  basePrice?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  taxRate?: number;
}
