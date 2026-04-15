import { Controller, Get, Post, Patch, Body, Param, Request, UseGuards } from '@nestjs/common';
import { DriverOpsService } from './driver-ops.service';
import { CreateExpenseDto, UpdateTripStatusDto, LocationDto } from './dto/driver-ops.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Driver Operations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('driver-ops')
export class DriverOpsController {
  constructor(private readonly driverOpsService: DriverOpsService) {}

  @Get('trips/today')
  getTodayTrips(@Request() req: any) {
    const tenantId = req.user.tenantId;
    const driverId = req.user.id;
    return this.driverOpsService.getTodayTrips(tenantId, driverId);
  }

  @Get('trips/:tripId/manifest')
  getManifest(@Request() req: any, @Param('tripId') tripId: string) {
    const tenantId = req.user.tenantId;
    const driverId = req.user.id;
    return this.driverOpsService.getManifest(tenantId, driverId, tripId);
  }

  @Post('check-in/:pnr')
  checkIn(@Request() req: any, @Param('pnr') pnr: string) {
    const tenantId = req.user.tenantId;
    const driverId = req.user.id;
    return this.driverOpsService.checkInPassenger(tenantId, driverId, pnr);
  }

  @Post('no-show/:pnr')
  noShow(@Request() req: any, @Param('pnr') pnr: string) {
    const tenantId = req.user.tenantId;
    const driverId = req.user.id;
    return this.driverOpsService.markNoShow(tenantId, driverId, pnr);
  }

  @Post('reset-boarding/:pnr')
  resetBoarding(@Request() req: any, @Param('pnr') pnr: string) {
    const tenantId = req.user.tenantId;
    const driverId = req.user.id;
    return this.driverOpsService.resetBoardingStatus(tenantId, driverId, pnr);
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
