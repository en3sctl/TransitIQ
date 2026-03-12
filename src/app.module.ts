import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
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

import { ConfigModule } from '@nestjs/config';
import { MockAuthMiddleware } from './common/middleware/mock-auth.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    VehiclesModule,
    UsersModule,
    RoutesModule,
    SharedModule,
    TripsModule,
    AiModule,
    DriverOpsModule,
    BookingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MockAuthMiddleware).forRoutes('*');
  }
}
