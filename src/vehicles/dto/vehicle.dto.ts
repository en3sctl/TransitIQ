import { IsString, IsInt, IsNotEmpty, IsOptional, Min, Matches } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  registrationPlate: string;

  @IsString()
  @IsNotEmpty()
  make: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsInt()
  @Min(1900)
  year: number;

  @IsString()
  @IsNotEmpty()
  chassisNumber: string;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsString()
  @Matches(/^\d\+\d$/, { message: 'layoutType must be like "2+1", "2+2", or "1+1"' })
  layoutType: string;
}

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  registrationPlate?: string;

  @IsOptional()
  @IsString()
  make?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  year?: number;

  @IsOptional()
  @IsString()
  chassisNumber?: string;

  @IsOptional()
  @IsString()
  engineNumber?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsString()
  @Matches(/^\d\+\d$/, { message: 'layoutType must be like "2+1", "2+2", or "1+1"' })
  layoutType?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsInt()
  currentMileage?: number;

  @IsOptional()
  muayeneTarihi?: Date;

  @IsOptional()
  sigortaTarihi?: Date;
}
