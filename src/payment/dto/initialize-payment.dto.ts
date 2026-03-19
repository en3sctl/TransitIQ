import { IsString, IsNotEmpty, IsEmail, Length } from 'class-validator';

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
}
