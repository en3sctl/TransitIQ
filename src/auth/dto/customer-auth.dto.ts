import { IsEmail, IsString, MinLength, IsNotEmpty, Matches, IsOptional } from 'class-validator';

export class CustomerRegisterDto {
  @IsEmail({}, { message: 'Geçerli bir email giriniz' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6, { message: 'Şifre en az 6 karakter olmalıdır' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Ad gereklidir' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Soyad gereklidir' })
  lastName: string;

  @IsString()
  @IsOptional()
  @Matches(/^(\+90|0)?5\d{9}$/, { message: 'Geçerli bir telefon numarası giriniz' })
  phone?: string;
}

export class CustomerLoginDto {
  @IsEmail({}, { message: 'Geçerli bir email giriniz' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Şifre gereklidir' })
  password: string;
}

export class GuestTicketLookupDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^TX-[A-Z0-9]+$/i, { message: 'Geçersiz PNR formatı' })
  pnrCode: string;

  @IsEmail({}, { message: 'Geçerli bir email giriniz' })
  @IsNotEmpty()
  email: string;
}
