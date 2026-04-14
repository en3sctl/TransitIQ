import { IsEmail, IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class ContactMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'Ad gereklidir' })
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsEmail({}, { message: 'Geçerli bir email giriniz' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Konu gereklidir' })
  @MinLength(3)
  @MaxLength(150)
  subject: string;

  @IsString()
  @IsNotEmpty({ message: 'Mesaj gereklidir' })
  @MinLength(10)
  @MaxLength(2000)
  message: string;
}
