import { Controller, Get, Post, Patch, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FeedbackService } from './feedback.service';
import type { CreateReviewDto, CreateComplaintDto, UpdateComplaintDto } from './feedback.service';

@ApiTags('Feedback')
@Controller()
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  // ─── Reviews (customer) ───

  @Post('reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  createReview(@Request() req: any, @Body() dto: CreateReviewDto) {
    return this.feedbackService.createReview(req.user.id, dto);
  }

  @Get('reviews/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getMyReviews(@Request() req: any) {
    return this.feedbackService.getMyReviews(req.user.id);
  }

  @Get('reviews/booking/:bookingId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getReviewForBooking(@Request() req: any, @Param('bookingId') bookingId: string) {
    return this.feedbackService.getReviewForBooking(req.user.id, bookingId);
  }

  // ─── Reviews (public) ───

  @Get('reviews/public/driver/:driverId')
  @Throttle({ short: { limit: 20, ttl: 10000 } })
  getPublicDriverReviews(
    @Param('driverId') driverId: string,
    @Query('take') take?: string,
  ) {
    return this.feedbackService.getPublicDriverReviews(driverId, take ? parseInt(take, 10) : 6);
  }

  // ─── Reviews (admin) ───

  @Get('admin/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getAdminReviews(
    @Request() req: any,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('driverId') driverId?: string,
    @Query('minRating') minRating?: string,
  ) {
    return this.feedbackService.getAdminReviews(req.user.tenantId, {
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 25,
      driverId, minRating: minRating ? parseInt(minRating, 10) : undefined,
    });
  }

  @Patch('admin/reviews/:id/toggle-hidden')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  toggleReviewHidden(@Request() req: any, @Param('id') id: string) {
    return this.feedbackService.toggleReviewHidden(req.user.tenantId, id);
  }

  // ─── Complaints ───

  @Post('complaints')
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  async createComplaint(@Request() req: any, @Body() dto: CreateComplaintDto) {
    // Anonymous complaints allowed; if authed, attach userId
    const userId = req.user?.id;
    return this.feedbackService.createComplaint({ ...dto, userId });
  }

  @Get('admin/complaints')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getAdminComplaints(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    // Super admin tüm firmaların şikayetlerini görür (cross-tenant)
    const scope = req.user.role === 'SUPER_ADMIN' ? null : req.user.tenantId;
    return this.feedbackService.getAdminComplaints(scope, {
      status,
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 25,
    });
  }

  @Patch('admin/complaints/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateComplaint(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateComplaintDto,
  ) {
    // Super admin cross-tenant update yapabilir (tenantId bypass)
    const scope = req.user.role === 'SUPER_ADMIN' ? null : req.user.tenantId;
    return this.feedbackService.updateComplaint(scope, id, dto);
  }
}
