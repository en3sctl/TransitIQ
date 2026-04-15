import { IsString, IsEmail, IsNotEmpty, IsOptional, MinLength, Matches } from 'class-validator';

export class CreateDriverDto {
  @IsString()
  @IsNotEmpty({ message: 'Ad soyad gereklidir' })
  name: string;

  @IsEmail({}, { message: 'Geçerli bir email giriniz' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Şifre en az 6 karakter olmalıdır' })
  password: string;

  @IsOptional()
  @IsString()
  @Matches(/^(\+90|0)?5\d{9}$/, { message: 'Geçerli bir telefon numarası giriniz (örn: 05XX XXX XX XX)' })
  phoneNumber?: string;
}

export class UpdateDriverDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(\+90|0)?5\d{9}$/, { message: 'Geçerli bir telefon numarası giriniz' })
  phoneNumber?: string;
}
