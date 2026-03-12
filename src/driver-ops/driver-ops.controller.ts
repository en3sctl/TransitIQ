import { Controller, Get, Post, Patch, Body, Param, Request } from '@nestjs/common';
import { DriverOpsService } from './driver-ops.service';
import { CreateExpenseDto, UpdateTripStatusDto, LocationDto } from './dto/driver-ops.dto';

import { ApiTags } from '@nestjs/swagger';

@ApiTags('Driver Operations')
@Controller('driver-ops')
export class DriverOpsController {
  constructor(private readonly driverOpsService: DriverOpsService) {}

  @Get('trips/today')
  getTodayTrips(@Request() req: any) {
    const tenantId = req.user.tenantId;
    const driverId = req.user.id;
    return this.driverOpsService.getTodayTrips(tenantId, driverId);
  }

  @Patch('trips/:tripId/status')
  updateTripStatus(
    @Request() req: any,
    @Param('tripId') tripId: string,
    @Body() updateTripStatusDto: UpdateTripStatusDto,
  ) {
    const tenantId = req.user.tenantId;
    const driverId = req.user.id;
    return this.driverOpsService.updateTripStatus(tenantId, driverId, tripId, updateTripStatusDto);
  }

  @Post('trips/:tripId/location')
  logLocation(
    @Request() req: any,
    @Param('tripId') tripId: string,
    @Body() locationDto: LocationDto,
  ) {
    const tenantId = req.user.tenantId;
    const driverId = req.user.id;
    return this.driverOpsService.logLocation(tenantId, driverId, tripId, locationDto);
  }

  @Post('trips/:tripId/expenses')
  createExpense(
    @Request() req: any,
    @Param('tripId') tripId: string,
    @Body() createExpenseDto: CreateExpenseDto,
  ) {
    const tenantId = req.user.tenantId;
    const driverId = req.user.id;
    return this.driverOpsService.createExpense(tenantId, driverId, tripId, createExpenseDto);
  }
}
