import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './google.strategy';
import { PrismaService } from '../common/prisma/prisma.service';
import { PaymentModule } from '../payment/payment.module';
import { PassengerFeaturesModule } from '../passenger-features/passenger-features.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WaitingListModule } from '../waiting-list/waiting-list.module';
import { SessionsService } from '../security/sessions.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        // Geriye uyumluluk: JWT_EXPIRES_IN eski single-token davranışı; yeni access için 15dk varsayılan
        signOptions: { expiresIn: config.get('JWT_ACCESS_EXPIRES_IN') || config.get('JWT_EXPIRES_IN', '15m') },
      }),
    }),
    forwardRef(() => PaymentModule),
    forwardRef(() => PassengerFeaturesModule),
    forwardRef(() => NotificationsModule),
    forwardRef(() => WaitingListModule),
  ],
  providers: [AuthService, JwtStrategy, GoogleStrategy, PrismaService, SessionsService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
