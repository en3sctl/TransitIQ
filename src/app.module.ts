import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { SentryModule, SentryGlobalFilter } from '@sentry/nestjs/setup';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { UsersModule } from './users/users.module';
import { RoutesModule } from './routes/routes.module';
import { SharedModule } from './shared/shared.module';
import { TripsModule } from './trips/trips.module';
import { AiModule } from './ai/ai.module';
import { DriverOpsModule } from './driver-ops/driver-ops.module';
import { BookingModule } from './booking/booking.module';
import { AuthModule } from './auth/auth.module';
import { StationsModule } from './stations/stations.module';
import { PaymentModule } from './payment/payment.module';
import { TasksModule } from './tasks/tasks.module';
import { TicketsModule } from './tickets/tickets.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CarbonModule } from './shared/carbon/carbon.module';
import { CityImageModule } from './shared/city-image/city-image.module';
import { OtogarModule } from './shared/otogar/otogar.module';
import { PassengerFeaturesModule } from './passenger-features/passenger-features.module';
import { PromoModule } from './promo/promo.module';
import { FeedbackModule } from './feedback/feedback.module';
import { WaitingListModule } from './waiting-list/waiting-list.module';
import { TenantModule } from './tenant/tenant.module';
import { SettlementModule } from './settlement/settlement.module';
import { AdminSearchModule } from './search/admin-search.module';
import { PlatformModule } from './platform/platform.module';
import { OperationsModule } from './operations/operations.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { SecurityModule } from './security/security.module';
import { CommerceModule } from './commerce/commerce.module';
import { DevopsModule } from './devops/devops.module';
import { ComplianceModule } from './compliance/compliance.module';
import { MaintenanceMiddleware } from './common/middleware/maintenance.middleware';
import { MiddlewareConsumer, NestModule } from '@nestjs/common';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: {
        maxAge: 1000 * 60 * 60 * 24, // 24h browser cache
        immutable: true,
      },
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,   // 1 second
        limit: 5,    // 5 requests per second
      },
      {
        name: 'medium',
        ttl: 60000,  // 1 minute
        limit: 60,   // 60 requests per minute
      },
      {
        name: 'long',
        ttl: 3600000, // 1 hour
        limit: 1000,  // 1000 requests per hour
      },
    ]),
    AuthModule,
    CommonModule,
    VehiclesModule,
    UsersModule,
    RoutesModule,
    SharedModule,
    TripsModule,
    AiModule,
    DriverOpsModule,
    BookingModule,
    StationsModule,
    PaymentModule,
    TasksModule,
    TicketsModule,
    NotificationsModule,
    CarbonModule,
    CityImageModule,
    OtogarModule,
    PassengerFeaturesModule,
    PromoModule,
    FeedbackModule,
    WaitingListModule,
    TenantModule,
    SettlementModule,
    AdminSearchModule,
    PlatformModule,
    OperationsModule,
    OnboardingModule,
    SecurityModule,
    CommerceModule,
    DevopsModule,
    ComplianceModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Sentry filter MUTLAKA önce — exception'ları capture eder, sonra HttpExceptionFilter çalışır
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MaintenanceMiddleware).forRoutes('*');
  }
}
