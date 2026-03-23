import { IsString, IsInt, IsNotEmpty, Min, Matches } from 'class-validator';

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
  @IsString()
  @IsNotEmpty()
  registrationPlate?: string;

  @IsString()
  make?: string;

  @IsString()
  model?: string;

  @IsInt()
  @Min(1900)
  year?: number;

  @IsString()
  chassisNumber?: string;

  @IsInt()
  @Min(1)
  capacity?: number;

  @IsString()
  status?: string;
}
