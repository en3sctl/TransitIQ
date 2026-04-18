import { Controller, Delete, ForbiddenException, Get, Post, Patch, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
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

  @Get('trips/:tripId/expenses')
  listExpenses(@Request() req: any, @Param('tripId') tripId: string) {
    return this.driverOpsService.listExpensesForTrip(req.user.tenantId, req.user.id, tripId);
  }

  @Delete('expenses/:id')
  deleteExpense(@Request() req: any, @Param('id') id: string) {
    return this.driverOpsService.deleteExpense(req.user.tenantId, req.user.id, id);
  }

  @Post('trips/:tripId/sos')
  triggerSos(
    @Request() req: any,
    @Param('tripId') tripId: string,
    @Body() body: { category?: 'ACCIDENT' | 'MEDICAL' | 'MECHANICAL' | 'SECURITY' | 'OTHER'; note?: string; lat?: number; lng?: number },
  ) {
    return this.driverOpsService.triggerSos(req.user.tenantId, req.user.id, tripId, body);
  }

  @Get('trips/:tripId/pre-check')
  getPreTripCheck(@Request() req: any, @Param('tripId') tripId: string) {
    return this.driverOpsService.getPreTripCheck(req.user.tenantId, req.user.id, tripId);
  }

  // ─── Admin endpointleri (firma admin) ───

  private assertCompanyAdmin(user: any) {
    if (!user || !['COMPANY_ADMIN', 'SUPER_ADMIN', 'OPERATOR'].includes(user.role)) {
      throw new ForbiddenException('Firma admin yetkisi gerekli');
    }
  }

  @Get('admin/expenses')
  adminExpenses(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    this.assertCompanyAdmin(req.user);
    return this.driverOpsService.adminListExpenses(req.user.tenantId, {
      status,
      take: take ? parseInt(take, 10) : 100,
      skip: skip ? parseInt(skip, 10) : 0,
    });
  }

  @Patch('admin/expenses/:id/review')
  reviewExpense(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { action: 'APPROVE' | 'REJECT'; note?: string },
  ) {
    this.assertCompanyAdmin(req.user);
    return this.driverOpsService.adminReviewExpense(req.user.tenantId, req.user.id, id, body.action, body.note);
  }

  @Get('admin/sos-events')
  adminSosEvents(
    @Request() req: any,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    this.assertCompanyAdmin(req.user);
    return this.driverOpsService.adminListSosEvents(req.user.tenantId, {
      take: take ? parseInt(take, 10) : 50,
      skip: skip ? parseInt(skip, 10) : 0,
    });
  }

  @Get('admin/pre-trip-checks')
  adminPreTripChecks(
    @Request() req: any,
    @Query('hasIssue') hasIssue?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    this.assertCompanyAdmin(req.user);
    return this.driverOpsService.adminListPreTripChecks(req.user.tenantId, {
      hasIssue: hasIssue === 'true' ? true : hasIssue === 'false' ? false : undefined,
      take: take ? parseInt(take, 10) : 50,
      skip: skip ? parseInt(skip, 10) : 0,
    });
  }

  @Post('trips/:tripId/pre-check')
  submitPreTripCheck(
    @Request() req: any,
    @Param('tripId') tripId: string,
    @Body() body: {
      fuelOk: boolean; tiresOk: boolean; brakesOk: boolean; lightsOk: boolean;
      hornOk: boolean; wipersOk: boolean; mirrorsOk: boolean; seatbeltsOk: boolean;
      acOk: boolean; cleanInside: boolean; extinguisherOk: boolean;
      firstAidOk: boolean; emergencyHammerOk: boolean;
      odometerKm?: number; fuelLevelPercent?: number; issueNote?: string;
    },
  ) {
    return this.driverOpsService.submitPreTripCheck(req.user.tenantId, req.user.id, tripId, body);
  }
}
