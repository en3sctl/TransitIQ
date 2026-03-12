import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateRouteDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  startLocation: string;

  @IsString()
  @IsNotEmpty()
  endLocation: string;

  @IsNumber()
  @Min(0)
  basePrice: number;

  @IsNumber()
  @Min(0)
  taxRate: number;
}

export class UpdateRouteDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  startLocation?: string;

  @IsString()
  @IsOptional()
  endLocation?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  basePrice?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  taxRate?: number;
}
