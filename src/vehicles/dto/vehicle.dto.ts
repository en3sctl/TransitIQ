import { IsString, IsInt, IsNumber, IsNotEmpty, Min } from 'class-validator';

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
