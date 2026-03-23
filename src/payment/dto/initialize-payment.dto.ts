import { IsString, IsNotEmpty, IsEmail, Length, IsArray, ArrayMinSize, ValidateNested, IsUUID, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

class PaymentPassengerDto {
  @IsString()
  @IsNotEmpty()
  @Length(11, 11)
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

export class InitializePaymentDto {
  @IsString()
  @IsNotEmpty()
  price: string;

  @IsString()
  @IsNotEmpty()
  buyerName: string;

  @IsString()
  @IsNotEmpty()
  buyerSurname: string;

  @IsString()
  @Length(11, 11)
  buyerTc: string;

  @IsEmail()
  buyerEmail: string;

  @IsString()
  @IsNotEmpty()
  buyerPhone: string;

  // Booking data for post-payment processing
  @IsUUID()
  @IsOptional()
  tripId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PaymentPassengerDto)
  @IsOptional()
  passengers?: PaymentPassengerDto[];
}
