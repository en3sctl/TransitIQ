import { Controller, Get, Post, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MaintenanceService } from './maintenance.service';
import type { MaintenanceDto, FuelLogDto } from './maintenance.service';

@ApiTags('Vehicle Maintenance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vehicles/:vehicleId')
export class MaintenanceController {
  constructor(private readonly svc: MaintenanceService) {}

  @Get('summary')
  summary(@Request() req: any, @Param('vehicleId') vehicleId: string) {
    return this.svc.getVehicleSummary(req.user.tenantId, vehicleId);
  }

  // ─── Maintenance ───
  @Get('maintenance')
  listMaintenance(@Request() req: any, @Param('vehicleId') vehicleId: string) {
    return this.svc.listMaintenance(req.user.tenantId, vehicleId);
  }

  @Post('maintenance')
  createMaintenance(
    @Request() req: any,
    @Param('vehicleId') vehicleId: string,
    @Body() dto: MaintenanceDto,
  ) {
    return this.svc.createMaintenance(req.user.tenantId, vehicleId, dto, req.user.id);
  }

  @Delete('maintenance/:recordId')
  deleteMaintenance(
    @Request() req: any,
    @Param('recordId') recordId: string,
  ) {
    return this.svc.deleteMaintenance(req.user.tenantId, recordId, req.user.id);
  }

  // ─── Fuel ───
  @Get('fuel')
  listFuel(@Request() req: any, @Param('vehicleId') vehicleId: string) {
    return this.svc.listFuel(req.user.tenantId, vehicleId);
  }

  @Post('fuel')
  createFuel(
    @Request() req: any,
    @Param('vehicleId') vehicleId: string,
    @Body() dto: FuelLogDto,
  ) {
    return this.svc.createFuel(req.user.tenantId, vehicleId, dto, req.user.id);
  }

  @Delete('fuel/:logId')
  deleteFuel(
    @Request() req: any,
    @Param('logId') logId: string,
  ) {
    return this.svc.deleteFuel(req.user.tenantId, logId, req.user.id);
  }
}
