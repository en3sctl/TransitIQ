import { Controller, Delete, ForbiddenException, Get, Post, Patch, Body, Param, Query, Request, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DriverOpsService } from './driver-ops.service';
import { CreateExpenseDto, UpdateTripStatusDto, LocationDto } from './dto/driver-ops.dto';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
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

  @Post('admin/incidents/resolve')
  resolveIncident(
    @Request() req: any,
    @Body() body: {
      referenceType: 'SOS' | 'PRE_TRIP';
      referenceId: string;
      status?: 'RESOLVED' | 'FALSE_ALARM' | 'ACKNOWLEDGED';
      note: string;
    },
  ) {
    this.assertCompanyAdmin(req.user);
    return this.driverOpsService.resolveIncident(req.user.tenantId, req.user.id, body);
  }

  @Post('admin/incidents/reopen')
  reopenIncident(
    @Request() req: any,
    @Body() body: { referenceType: 'SOS' | 'PRE_TRIP'; referenceId: string },
  ) {
    this.assertCompanyAdmin(req.user);
    return this.driverOpsService.reopenIncident(req.user.tenantId, body.referenceType, body.referenceId);
  }

  // ─── Driver kendi profili ───

  @Get('me/profile')
  getMyProfile(@Request() req: any) {
    return this.driverOpsService.getMyProfile(req.user.tenantId, req.user.id);
  }

  @Patch('me/profile')
  updateMyProfile(@Request() req: any, @Body() body: any) {
    return this.driverOpsService.updateMyProfile(req.user.tenantId, req.user.id, body);
  }

  @Post('me/documents')
  upsertMyDocument(@Request() req: any, @Body() body: any) {
    return this.driverOpsService.upsertDocument(req.user.tenantId, req.user.id, body);
  }

  @Delete('me/documents/:id')
  deleteMyDocument(@Request() req: any, @Param('id') id: string) {
    return this.driverOpsService.deleteDocument(req.user.id, id);
  }

  @Post('me/avatar')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatar', {
    limits: { fileSize: 3 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!/^image\/(png|jpeg|jpg|webp)$/i.test(file.mimetype)) {
        return cb(new Error('Sadece PNG/JPG/WebP'), false);
      }
      cb(null, true);
    },
  }))
  uploadAvatar(@Request() req: any, @UploadedFile() file: any) {
    if (!file) throw new ForbiddenException('Dosya gerekli');
    return this.driverOpsService.uploadAvatar(req.user.id, file.buffer);
  }

  @Delete('me/avatar')
  removeAvatar(@Request() req: any) {
    return this.driverOpsService.removeAvatar(req.user.id);
  }

  // ─── Dijital belge cüzdanı ───

  @Post('me/wallet/token')
  createWalletToken(@Request() req: any) {
    return this.driverOpsService.createWalletToken(req.user.id);
  }

  @Delete('me/wallet/token')
  revokeWalletToken(@Request() req: any) {
    return this.driverOpsService.revokeMyWalletToken(req.user.id);
  }

  // ─── Peer road alerts ───

  @Post('road-alerts')
  createRoadAlert(
    @Request() req: any,
    @Body() body: { category: string; note?: string; lat: number; lng: number },
  ) {
    return this.driverOpsService.createRoadAlert(req.user.tenantId, req.user.id, body);
  }

  @Get('road-alerts/nearby')
  nearbyRoadAlerts(
    @Request() req: any,
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
  ) {
    return this.driverOpsService.listNearbyRoadAlerts(
      parseFloat(lat), parseFloat(lng),
      radius ? parseFloat(radius) : 50,
    );
  }

  @Post('road-alerts/:id/vote')
  voteRoadAlert(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { vote: 'up' | 'down' | 'verify' },
  ) {
    return this.driverOpsService.voteRoadAlert(req.user.id, id, body.vote);
  }

  @Delete('road-alerts/:id')
  deleteRoadAlert(@Request() req: any, @Param('id') id: string) {
    return this.driverOpsService.deleteRoadAlert(req.user.id, id);
  }

  // ─── Lost items ───

  @Post('lost-items')
  reportLostItem(@Request() req: any, @Body() body: {
    pnrCode?: string; reporterName: string; reporterPhone?: string; itemDescription: string;
  }) {
    return this.driverOpsService.reportLostItem({
      ...body,
      reporterUserId: req.user?.id,
    });
  }

  @Get('trips/:tripId/lost-items')
  driverLostItems(@Request() req: any, @Param('tripId') tripId: string) {
    return this.driverOpsService.driverListLostItems(req.user.tenantId, req.user.id, tripId);
  }

  @Patch('lost-items/:id')
  driverUpdateLostItem(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { status: 'FOUND' | 'NOT_FOUND' | 'CLAIMED'; note?: string },
  ) {
    return this.driverOpsService.driverUpdateLostItem(req.user.tenantId, req.user.id, id, body);
  }

  @Get('admin/lost-items')
  adminLostItems(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    this.assertCompanyAdmin(req.user);
    return this.driverOpsService.adminListLostItems(req.user.tenantId, {
      status,
      take: take ? parseInt(take, 10) : 100,
      skip: skip ? parseInt(skip, 10) : 0,
    });
  }

  @Post('me/documents/:id/file')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!/^(image\/(png|jpeg|jpg|webp)|application\/pdf)$/i.test(file.mimetype)) {
        return cb(new Error('Sadece PNG/JPG/WebP veya PDF'), false);
      }
      cb(null, true);
    },
  }))
  uploadDocumentFile(
    @Request() req: any,
    @Param('id') documentId: string,
    @UploadedFile() file: any,
  ) {
    if (!file) throw new ForbiddenException('Dosya gerekli');
    return this.driverOpsService.uploadDocumentFile(req.user.id, documentId, file.buffer, file.mimetype);
  }

  // ─── Admin: başka şoförün 360° detayı ───

  @Get('admin/drivers/:id/profile')
  adminDriverProfile(@Request() req: any, @Param('id') id: string) {
    this.assertCompanyAdmin(req.user);
    return this.driverOpsService.adminGetDriverProfile(req.user.tenantId, id);
  }

  @Post('admin/drivers/:id/documents')
  adminUpsertDocument(@Request() req: any, @Param('id') driverId: string, @Body() body: any) {
    this.assertCompanyAdmin(req.user);
    return this.driverOpsService.upsertDocument(req.user.tenantId, driverId, body);
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
