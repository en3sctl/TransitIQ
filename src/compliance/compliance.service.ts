import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ComplianceService {
  constructor(private prisma: PrismaService) {}

  // ════════════════════════════════════════════════════════════════
  // Support Tickets
  // ════════════════════════════════════════════════════════════════

  async createTicket(data: {
    subject: string; body: string; contactEmail: string; contactName: string;
    userId?: string; tenantId?: string; category?: string; priority?: string;
  }) {
    if (!data.subject?.trim() || !data.body?.trim()) throw new BadRequestException('Konu ve mesaj gerekli');
    const ticket = await this.prisma.supportTicket.create({
      data: {
        subject: data.subject.trim().slice(0, 200),
        contactEmail: data.contactEmail.toLowerCase().trim(),
        contactName: data.contactName.trim(),
        userId: data.userId || null,
        tenantId: data.tenantId || null,
        category: data.category || null,
        priority: data.priority || 'NORMAL',
      },
    });
    // First message
    await this.prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        authorId: data.userId || null,
        authorName: data.contactName,
        body: data.body.trim(),
      },
    });
    return ticket;
  }

  async listTickets(opts: { status?: string; priority?: string; tenantId?: string; take?: number; skip?: number } = {}) {
    const { status, priority, tenantId, take = 50, skip = 0 } = opts;
    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (tenantId) where.tenantId = tenantId;
    const [items, total, stats] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where, orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }], take, skip,
        include: { _count: { select: { messages: true } } },
      }),
      this.prisma.supportTicket.count({ where }),
      this.prisma.supportTicket.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);
    const statsMap = stats.reduce((a, s) => { a[s.status] = s._count._all; return a; }, {} as Record<string, number>);
    return { items, total, stats: statsMap };
  }

  async getTicket(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!ticket) throw new NotFoundException();
    return ticket;
  }

  async replyTicket(ticketId: string, authorId: string, authorName: string, body: string, internal = false) {
    const msg = await this.prisma.supportMessage.create({
      data: { ticketId, authorId, authorName, body: body.trim(), internal },
    });
    if (!internal) {
      // Update status to IN_PROGRESS if it was OPEN
      await this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: 'IN_PROGRESS' },
      }).catch(() => {});
    }
    return msg;
  }

  async updateTicketStatus(id: string, status: string, priority?: string, assignedTo?: string) {
    const valid = ['OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED'];
    if (status && !valid.includes(status)) throw new BadRequestException('Geçersiz durum');
    const data: any = {};
    if (status) data.status = status;
    if (priority) data.priority = priority;
    if (assignedTo !== undefined) data.assignedTo = assignedTo;
    return this.prisma.supportTicket.update({ where: { id }, data });
  }

  // ════════════════════════════════════════════════════════════════
  // Terms Versions
  // ════════════════════════════════════════════════════════════════

  async listTermsVersions(kind?: string) {
    return this.prisma.termsVersion.findMany({
      where: kind ? { kind } : {},
      orderBy: { publishedAt: 'desc' },
    });
  }

  async getCurrentTerms(kind: string) {
    return this.prisma.termsVersion.findFirst({ where: { kind, current: true } });
  }

  async publishTermsVersion(data: { kind?: string; version: string; bodyHtml: string; summary?: string }) {
    if (!data.version || !data.bodyHtml) throw new BadRequestException();
    const kind = data.kind || 'TERMS';
    // Mark current=false on previous
    await this.prisma.termsVersion.updateMany({ where: { kind, current: true }, data: { current: false } });
    return this.prisma.termsVersion.create({
      data: {
        kind,
        version: data.version,
        bodyHtml: data.bodyHtml,
        summary: data.summary || null,
        current: true,
      },
    });
  }

  // ════════════════════════════════════════════════════════════════
  // Consent Logs
  // ════════════════════════════════════════════════════════════════

  async recordConsent(data: {
    userId?: string; email?: string; kind: string; version?: string; granted: boolean;
    ipAddress?: string; userAgent?: string;
  }) {
    return this.prisma.consentLog.create({
      data: {
        userId: data.userId || null,
        email: data.email?.toLowerCase() || null,
        kind: data.kind,
        version: data.version || null,
        granted: data.granted,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent?.slice(0, 500) || null,
      },
    });
  }

  async listConsentForUser(userOrEmail: { userId?: string; email?: string }) {
    const where: any = {};
    if (userOrEmail.userId) where.userId = userOrEmail.userId;
    if (userOrEmail.email) where.email = userOrEmail.email.toLowerCase();
    return this.prisma.consentLog.findMany({
      where, orderBy: { createdAt: 'desc' }, take: 100,
    });
  }
}
