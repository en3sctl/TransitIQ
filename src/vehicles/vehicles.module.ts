import { Module } from '@nestjs/common';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';

@Module({
  controllers: [VehiclesController, MaintenanceController],
  providers: [VehiclesService, MaintenanceService],
  exports: [VehiclesService, MaintenanceService],
})
export class VehiclesModule {}
