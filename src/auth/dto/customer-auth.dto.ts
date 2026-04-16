import { IsEmail, IsString, MinLength, IsNotEmpty, Matches, IsOptional, ValidateIf } from 'class-validator';

export class CustomerRegisterDto {
  @IsEmail({}, { message: 'Geçerli bir email giriniz' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalıdır' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Ad gereklidir' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Soyad gereklidir' })
  lastName: string;

  @IsOptional()
  @ValidateIf((o) => o.phone !== undefined && o.phone !== null && o.phone !== '')
  @IsString()
  @Matches(/^(\+90|0)?5\d{9}$/, { message: 'Geçerli bir telefon numarası giriniz (örn: 05XX XXX XX XX)' })
  phone?: string;

  @IsOptional()
  @IsString()
  referralCode?: string;
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

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsOptional()
  @ValidateIf((o) => o.phone !== undefined && o.phone !== null && o.phone !== '')
  @IsString()
  @Matches(/^(\+90|0)?5\d{9}$/, { message: 'Geçerli bir telefon numarası giriniz' })
  phone?: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Mevcut şifre gereklidir' })
  currentPassword: string;

  @IsString()
  @MinLength(6, { message: 'Yeni şifre en az 6 karakter olmalıdır' })
  newPassword: string;
}
