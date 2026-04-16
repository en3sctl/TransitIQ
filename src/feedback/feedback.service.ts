import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface CreateReviewDto {
  bookingId: string;
  rating: number;
  comment?: string;
  tags?: string[];
}

export interface CreateComplaintDto {
  bookingId?: string;
  pnr?: string;
  contactEmail: string;
  contactName: string;
  category: string;
  subject: string;
  description: string;
}

export interface UpdateComplaintDto {
  status?: string;
  priority?: string;
  assignedTo?: string;
  resolution?: string;
}

const VALID_TAGS = ['CLEAN', 'ON_TIME', 'FRIENDLY', 'COMFORTABLE', 'RUDE', 'LATE', 'DIRTY', 'VALUE'];
const VALID_CATEGORIES = ['DELAY', 'DRIVER', 'CLEANLINESS', 'PAYMENT', 'SEAT', 'OTHER'];
const VALID_STATUS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'];
const VALID_PRIORITY = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

@Injectable()
export class FeedbackService {
  constructor(private prisma: PrismaService) {}

  // ─── Reviews ───

  async createReview(userId: string, dto: CreateReviewDto) {
    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('Puan 1-5 arasında olmalı');
    }
    const tags = (dto.tags || []).filter(t => VALID_TAGS.includes(t));

    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { trip: true },
    });
    if (!booking) throw new NotFoundException('Bilet bulunamadı');
    if (booking.userId !== userId) throw new ForbiddenException('Bu bilet sana ait değil');
    if (booking.status !== 'CONFIRMED') throw new BadRequestException('Yalnızca onaylı biletler değerlendirilebilir');
    if (new Date(booking.trip.departureTime) > new Date()) {
      throw new BadRequestException('Seferi tamamlandıktan sonra değerlendirebilirsin');
    }

    return this.prisma.review.upsert({
      where: { bookingId: dto.bookingId },
      create: {
        tenantId: booking.tenantId,
        bookingId: dto.bookingId,
        userId,
        tripId: booking.tripId,
        driverId: booking.trip.driverId,
        rating: dto.rating,
        comment: dto.comment || null,
        tags,
      },
      update: {
        rating: dto.rating,
        comment: dto.comment || null,
        tags,
      },
    });
  }

  async getMyReviews(userId: string) {
    return this.prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getReviewForBooking(userId: string, bookingId: string) {
    const r = await this.prisma.review.findUnique({ where: { bookingId } });
    if (!r) return null;
    if (r.userId !== userId) throw new ForbiddenException();
    return r;
  }

  async getAdminReviews(tenantId: string, opts: { skip?: number; take?: number; driverId?: string; minRating?: number } = {}) {
    const { skip = 0, take = 25, driverId, minRating } = opts;
    const where: any = { tenantId };
    if (driverId) where.driverId = driverId;
    if (minRating) where.rating = { gte: minRating };

    const [reviews, total, avg] = await Promise.all([
      this.prisma.review.findMany({
        where, orderBy: { createdAt: 'desc' }, skip, take,
      }),
      this.prisma.review.count({ where }),
      this.prisma.review.aggregate({ where, _avg: { rating: true } }),
    ]);

    return {
      reviews,
      total,
      averageRating: avg._avg.rating ? Math.round(Number(avg._avg.rating) * 10) / 10 : 0,
    };
  }

  /** Public: reviews list for a driver (PII-masked). Used by trip results. */
  async getPublicDriverReviews(driverId: string, take = 6) {
    const [items, agg] = await Promise.all([
      this.prisma.review.findMany({
        where: { driverId, hidden: false, OR: [{ comment: { not: null } }, { tags: { isEmpty: false } }] },
        orderBy: { createdAt: 'desc' },
        take: Math.min(Math.max(take, 1), 20),
        select: { id: true, rating: true, comment: true, tags: true, createdAt: true, userId: true },
      }),
      this.prisma.review.aggregate({
        where: { driverId, hidden: false },
        _avg: { rating: true },
        _count: { _all: true },
      }),
    ]);

    const userIds = Array.from(new Set(items.map((r) => r.userId)));
    const users = userIds.length
      ? await this.prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
      : [];
    const nameById = new Map(users.map((u) => [u.id, u.name || 'Yolcu']));

    const masked = items.map((r) => {
      const name = nameById.get(r.userId) || 'Yolcu';
      const author = name.split(' ').map((p) => (p.length > 1 ? p[0] + '.' : p)).join(' ');
      return {
        id: r.id, rating: r.rating, comment: r.comment, tags: r.tags, createdAt: r.createdAt, author,
      };
    });

    return {
      reviews: masked,
      averageRating: agg._avg.rating ? Math.round(Number(agg._avg.rating) * 10) / 10 : 0,
      totalCount: agg._count._all,
    };
  }

  async toggleReviewHidden(tenantId: string, reviewId: string) {
    const r = await this.prisma.review.findFirst({ where: { id: reviewId, tenantId } });
    if (!r) throw new NotFoundException();
    return this.prisma.review.update({ where: { id: reviewId }, data: { hidden: !r.hidden } });
  }

  // ─── Complaints ───

  async createComplaint(dto: CreateComplaintDto & { userId?: string; tenantId?: string }) {
    if (!VALID_CATEGORIES.includes(dto.category)) {
      throw new BadRequestException('Geçersiz kategori');
    }
    if (dto.subject.length < 3 || dto.subject.length > 200) {
      throw new BadRequestException('Konu 3-200 karakter olmalı');
    }
    if (dto.description.length < 10 || dto.description.length > 5000) {
      throw new BadRequestException('Açıklama 10-5000 karakter olmalı');
    }

    // Resolve PNR → bookingId server-side (keeps internal IDs private)
    let resolvedBookingId = dto.bookingId;
    if (!resolvedBookingId && dto.pnr) {
      const byPnr = await this.prisma.booking.findUnique({
        where: { pnrCode: dto.pnr.trim().toUpperCase() },
      });
      if (byPnr) resolvedBookingId = byPnr.id;
    }

    // Determine tenantId from booking if provided
    let tenantId = dto.tenantId;
    if (resolvedBookingId) {
      const booking = await this.prisma.booking.findUnique({ where: { id: resolvedBookingId } });
      if (booking) tenantId = booking.tenantId;
    }
    if (!tenantId) {
      const defaultTenant = await this.prisma.tenant.findFirst({ where: { slug: 'public-passengers' } });
      if (!defaultTenant) throw new BadRequestException('Tenant bulunamadı');
      tenantId = defaultTenant.id;
    }

    // Heuristic priority based on category
    const priority = ['PAYMENT', 'DRIVER'].includes(dto.category) ? 'HIGH' : 'NORMAL';

    return this.prisma.complaint.create({
      data: {
        tenantId,
        userId: dto.userId || null,
        bookingId: resolvedBookingId || null,
        contactEmail: dto.contactEmail,
        contactName: dto.contactName,
        category: dto.category,
        subject: dto.subject,
        description: dto.description,
        priority,
      },
    });
  }

  async getAdminComplaints(tenantId: string, opts: { status?: string; skip?: number; take?: number } = {}) {
    const { status, skip = 0, take = 25 } = opts;
    const where: any = { tenantId };
    if (status && VALID_STATUS.includes(status)) where.status = status;

    const [complaints, total, stats] = await Promise.all([
      this.prisma.complaint.findMany({
        where, orderBy: { createdAt: 'desc' }, skip, take,
      }),
      this.prisma.complaint.count({ where }),
      this.prisma.complaint.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { _all: true },
      }),
    ]);

    const statsMap = stats.reduce((acc, s) => { acc[s.status] = s._count._all; return acc; }, {} as Record<string, number>);

    return {
      complaints, total,
      stats: {
        open: statsMap.OPEN || 0,
        inProgress: statsMap.IN_PROGRESS || 0,
        resolved: statsMap.RESOLVED || 0,
        dismissed: statsMap.DISMISSED || 0,
      },
    };
  }

  async updateComplaint(tenantId: string, complaintId: string, dto: UpdateComplaintDto) {
    const c = await this.prisma.complaint.findFirst({ where: { id: complaintId, tenantId } });
    if (!c) throw new NotFoundException('Şikayet bulunamadı');

    const data: any = {};
    if (dto.status && VALID_STATUS.includes(dto.status)) {
      data.status = dto.status;
      if (dto.status === 'RESOLVED' && !c.resolvedAt) {
        data.resolvedAt = new Date();
      }
    }
    if (dto.priority && VALID_PRIORITY.includes(dto.priority)) data.priority = dto.priority;
    if (dto.assignedTo !== undefined) data.assignedTo = dto.assignedTo;
    if (dto.resolution !== undefined) data.resolution = dto.resolution;

    return this.prisma.complaint.update({ where: { id: complaintId }, data });
  }
}
