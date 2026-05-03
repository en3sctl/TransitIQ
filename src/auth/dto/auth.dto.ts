import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({ description: 'Cloudflare Turnstile token' })
  @IsOptional()
  @IsString()
  turnstileToken?: string;
}

export class RegisterDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  companyDomain: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ description: 'Cloudflare Turnstile token' })
  @IsOptional()
  @IsString()
  turnstileToken?: string;
}

// ─── Password Reset / Email Verification ───

export class PasswordResetRequestDto {
  @ApiProperty()
  @IsEmail({}, { message: 'Geçerli bir email gir' })
  email: string;
}

export class PasswordResetConfirmDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Token gerekli' })
  token: string;

  @ApiProperty()
  @IsString()
  @MinLength(8, { message: 'Yeni şifre en az 8 karakter olmalı' })
  newPassword: string;
}

export class EmailVerifyConfirmDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Token gerekli' })
  token: string;
}
