import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class CommerceService {
  private readonly logger = new Logger(CommerceService.name);

  constructor(private prisma: PrismaService) {}

  // ════════════════════════════════════════════════════════════════
  // Subscription Plans
  // ════════════════════════════════════════════════════════════════

  async listPlans() {
    return this.prisma.subscriptionPlan.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async createPlan(data: {
    name: string; slug: string; description?: string;
    monthlyFee?: number; commissionRate: number;
    maxVehicles?: number; maxRoutes?: number; maxMonthlyBookings?: number;
    features?: string[]; sortOrder?: number;
  }) {
    if (!data.name || !data.slug) throw new BadRequestException('Ad ve slug gerekli');
    if (data.commissionRate < 0 || data.commissionRate > 0.5) throw new BadRequestException('Komisyon 0-0.5 arası');
    return this.prisma.subscriptionPlan.create({
      data: {
        name: data.name.trim(),
        slug: data.slug.toLowerCase().replace(/[^a-z0-9-]/g, ''),
        description: data.description || null,
        monthlyFee: data.monthlyFee || 0,
        commissionRate: data.commissionRate,
        maxVehicles: data.maxVehicles || null,
        maxRoutes: data.maxRoutes || null,
        maxMonthlyBookings: data.maxMonthlyBookings || null,
        features: data.features || [],
        sortOrder: data.sortOrder || 0,
      },
    });
  }

  async updatePlan(id: string, data: any) {
    const update: any = {};
    for (const k of ['name', 'description', 'monthlyFee', 'commissionRate', 'maxVehicles', 'maxRoutes', 'maxMonthlyBookings', 'features', 'active', 'sortOrder']) {
      if (data[k] !== undefined) update[k] = data[k];
    }
    return this.prisma.subscriptionPlan.update({ where: { id }, data: update });
  }

  async deletePlan(id: string) {
    // Don't actually delete — just deactivate
    return this.prisma.subscriptionPlan.update({ where: { id }, data: { active: false } });
  }

  /** Seed default plans (idempotent). */
  async seedPlans() {
    const defaults = [
      {
        name: 'Başlangıç', slug: 'starter',
        description: 'Küçük otobüs firmaları için başlangıç planı',
        monthlyFee: 0, commissionRate: 0.10,
        maxVehicles: 5, maxRoutes: 20, maxMonthlyBookings: 1000,
        features: ['5 araç', '20 rota', 'Platform ödeme', 'E-posta destek', 'Standart analitik'],
        sortOrder: 1,
      },
      {
        name: 'Profesyonel', slug: 'pro',
        description: 'Orta ölçek firmalar için genişletilmiş özellikler',
        monthlyFee: 999, commissionRate: 0.07,
        maxVehicles: 30, maxRoutes: 100, maxMonthlyBookings: 10000,
        features: ['30 araç', '100 rota', 'Kendi Iyzico hesabı', 'Öncelikli destek', 'Gelişmiş analitik', 'API erişimi', 'Özel marka rengi'],
        sortOrder: 2,
      },
      {
        name: 'Kurumsal', slug: 'enterprise',
        description: 'Büyük filolar için özel çözüm',
        monthlyFee: 2999, commissionRate: 0.05,
        maxVehicles: null, maxRoutes: null, maxMonthlyBookings: null,
        features: ['Sınırsız araç & rota', 'Özel entegrasyonlar', 'Adanmış destek', 'SLA sözleşmesi', 'Özel domain', 'Webhook & API', 'Öncelikli uyarı'],
        sortOrder: 3,
      },
    ];

    let created = 0;
    for (const p of defaults) {
      const existing = await this.prisma.subscriptionPlan.findUnique({ where: { slug: p.slug } });
      if (!existing) {
        await this.prisma.subscriptionPlan.create({ data: p });
        created++;
      }
    }
    return { created, total: defaults.length };
  }

  async assignPlan(tenantId: string, planId: string | null) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException();
    let commissionRate = Number(tenant.commissionRate);
    if (planId) {
      const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
      if (plan) commissionRate = Number(plan.commissionRate);
    }
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { planId, commissionRate },
    });
  }

  // ════════════════════════════════════════════════════════════════
  // Invoices
  // ════════════════════════════════════════════════════════════════

  private generateInvoiceNo(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `TIQ-${y}${m}-${random}`;
  }

  /**
   * Settlement modelinde Booking relation tanımlı değil (sadece bookingId).
   * Bu yardımcı önce periodda olan booking ID'lerini bulur, sonra onların
   * settlement'larını döner. (Schema'ya relation eklemeden çalışsın diye.)
   */
  private async findSettlementsForPeriod(tenantId: string, periodStart: Date, periodEnd: Date) {
    const bookingsInPeriod = await this.prisma.booking.findMany({
      where: {
        tenantId,
        status: 'CONFIRMED',
        bookingTime: { gte: periodStart, lte: periodEnd },
      },
      select: { id: true },
    });
    if (bookingsInPeriod.length === 0) return [];
    return this.prisma.settlement.findMany({
      where: {
        tenantId,
        status: { in: ['PENDING', 'SETTLED'] },
        bookingId: { in: bookingsInPeriod.map((b) => b.id) },
      },
    });
  }

  /**
   * Bir periodda firmaya ait satışları hesapla — fatura yaratmadan.
   * Frontend'de modal preview'i için kullanılır.
   */
  async previewInvoice(tenantId: string, periodStart: Date, periodEnd: Date) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { plan: true },
    });
    if (!tenant) throw new NotFoundException();

    const settlements = await this.findSettlementsForPeriod(tenantId, periodStart, periodEnd);

    const grossTotal = settlements.reduce((s, x) => s + Number(x.grossAmount), 0);
    const commissionTotal = settlements.reduce((s, x) => s + Number(x.commissionAmount), 0);
    const netToCompany = settlements.reduce((s, x) => s + Number(x.netAmount), 0);
    const subscriptionFee = tenant.plan ? Number(tenant.plan.monthlyFee) : 0;
    const taxRate = 0.18;
    const taxAmount = Math.round((commissionTotal + subscriptionFee) * taxRate * 100) / 100;
    const total = Math.round((commissionTotal + subscriptionFee + taxAmount) * 100) / 100;

    // Backfill önerisi: bu firmada bu periodda CONFIRMED booking var mı ama settlement yok?
    const confirmedInPeriod = await this.prisma.booking.count({
      where: {
        tenantId, status: 'CONFIRMED',
        bookingTime: { gte: periodStart, lte: periodEnd },
      },
    });
    const missingSettlements = Math.max(0, confirmedInPeriod - settlements.length);

    return {
      tenant: { id: tenant.id, name: tenant.publicName || tenant.name, plan: tenant.plan?.name },
      bookingCount: settlements.length,
      confirmedInPeriod,
      missingSettlements,
      grossTotal: Math.round(grossTotal * 100) / 100,
      commissionTotal: Math.round(commissionTotal * 100) / 100,
      netToCompany: Math.round(netToCompany * 100) / 100,
      subscriptionFee,
      taxRate,
      taxAmount,
      total,
    };
  }

  /**
   * Generate an invoice for a tenant for a given billing period.
   * Aggregates all settlements within the period and adds monthly fee.
   */
  async generateInvoice(tenantId: string, periodStart: Date, periodEnd: Date) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { plan: true },
    });
    if (!tenant) throw new NotFoundException();

    const settlements = await this.findSettlementsForPeriod(tenantId, periodStart, periodEnd);

    const grossTotal = settlements.reduce((s, x) => s + Number(x.grossAmount), 0);
    const commissionTotal = settlements.reduce((s, x) => s + Number(x.commissionAmount), 0);
    const netToCompany = settlements.reduce((s, x) => s + Number(x.netAmount), 0);
    const subscriptionFee = tenant.plan ? Number(tenant.plan.monthlyFee) : 0;
    const taxRate = 0.18;
    const taxAmount = Math.round((commissionTotal + subscriptionFee) * taxRate * 100) / 100;

    const invoice = await this.prisma.invoice.create({
      data: {
        tenantId,
        invoiceNo: this.generateInvoiceNo(),
        periodStart, periodEnd,
        subscriptionFee,
        commissionTotal,
        bookingCount: settlements.length,
        grossTotal,
        netToCompany,
        taxRate,
        taxAmount,
        dueAt: new Date(periodEnd.getTime() + 14 * 86400000),
        status: 'DRAFT',
      },
    });

    // Try to generate PDF
    try {
      const pdfUrl = await this.generateInvoicePdf(invoice.id);
      await this.prisma.invoice.update({ where: { id: invoice.id }, data: { pdfUrl } });
      return { ...invoice, pdfUrl };
    } catch (err: any) {
      this.logger.warn(`[Invoice] PDF generation failed: ${err.message}`);
      return invoice;
    }
  }

  async listInvoicesForTenant(tenantId: string) {
    return this.prisma.invoice.findMany({
      where: { tenantId },
      orderBy: { periodEnd: 'desc' },
    });
  }

  async listAllInvoices(opts: { status?: string; tenantId?: string; take?: number; skip?: number } = {}) {
    const { status, tenantId, take = 100, skip = 0 } = opts;
    const where: any = {};
    if (status) where.status = status;
    if (tenantId) where.tenantId = tenantId;
    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where, orderBy: { periodEnd: 'desc' }, take, skip,
        include: { tenant: { select: { id: true, name: true, publicName: true, slug: true } } },
      }),
      this.prisma.invoice.count({ where }),
    ]);
    return { items, total };
  }

  async updateInvoiceStatus(id: string, status: string) {
    const valid = ['DRAFT', 'ISSUED', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'];
    if (!valid.includes(status)) throw new BadRequestException('Geçersiz durum');
    const data: any = { status };
    if (status === 'PAID') data.paidAt = new Date();
    if (status === 'SENT') data.sentAt = new Date();
    return this.prisma.invoice.update({ where: { id }, data });
  }

  /**
   * Türkçe destekli TTF font yolunu bul. Önce repo içi assets/fonts/,
   * sonra system fontlarını dener. Bulamazsa null döner ve metin
   * transliterate edilerek (ş→s, İ→I, vs.) Helvetica ile yazılır.
   */
  private resolveTurkishFont(): { regular: string | null; bold: string | null } {
    const tryPaths = [
      // Repo içi assets (önerilen — `npm run setup:fonts` ile indirilebilir)
      path.join(process.cwd(), 'assets', 'fonts', 'Roboto-Regular.ttf'),
      // Windows
      'C:/Windows/Fonts/segoeui.ttf',
      'C:/Windows/Fonts/arial.ttf',
      // macOS
      '/Library/Fonts/Arial.ttf',
      '/System/Library/Fonts/Helvetica.ttc',
      // Linux (DejaVu yaygın)
      '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
      '/usr/share/fonts/dejavu/DejaVuSans.ttf',
    ];
    const tryBoldPaths = [
      path.join(process.cwd(), 'assets', 'fonts', 'Roboto-Bold.ttf'),
      'C:/Windows/Fonts/segoeuib.ttf',
      'C:/Windows/Fonts/arialbd.ttf',
      '/Library/Fonts/Arial Bold.ttf',
      '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    ];
    const regular = tryPaths.find((p) => { try { return fs.existsSync(p); } catch { return false; } }) || null;
    const bold = tryBoldPaths.find((p) => { try { return fs.existsSync(p); } catch { return false; } }) || regular;
    return { regular, bold };
  }

  /** TR karakterleri ASCII'ye çevir (font yoksa fallback). */
  private toAscii(s: string): string {
    const map: Record<string, string> = {
      'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G', 'ı': 'i', 'İ': 'I',
      'ö': 'o', 'Ö': 'O', 'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U',
    };
    return s.replace(/[çÇğĞıİöÖşŞüÜ]/g, (c) => map[c] || c);
  }

  /** Generate a minimal but presentable PDF using pdfkit. */
  async generateInvoicePdf(invoiceId: string): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const PDFDocument = require('pdfkit');
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { tenant: true },
    });
    if (!invoice) throw new NotFoundException();

    const dir = path.join(process.cwd(), 'uploads', 'invoices');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filename = `${invoice.invoiceNo}.pdf`;
    const filepath = path.join(dir, filename);

    const fonts = this.resolveTurkishFont();
    const hasUnicode = !!fonts.regular;
    const REG = 'TR-Regular';
    const BOLD = 'TR-Bold';
    const t = (s: string) => hasUnicode ? s : this.toAscii(s);

    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      if (hasUnicode && fonts.regular) doc.registerFont(REG, fonts.regular);
      if (hasUnicode && fonts.bold) doc.registerFont(BOLD, fonts.bold);
      const fontReg = hasUnicode ? REG : 'Helvetica';
      const fontBold = hasUnicode ? BOLD : 'Helvetica-Bold';

      // Header
      doc.fontSize(20).font(fontBold).text('TRANSITIQ', 50, 50);
      doc.fontSize(10).font(fontReg).fillColor('#888').text(t('Platform Komisyon Faturası'), 50, 75);

      doc.fontSize(10).fillColor('#000').text(t(`Fatura No: ${invoice.invoiceNo}`), 400, 50, { align: 'right' });
      doc.text(t(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`), 400, 65, { align: 'right' });
      doc.text(t(`Dönem: ${invoice.periodStart.toLocaleDateString('tr-TR')} - ${invoice.periodEnd.toLocaleDateString('tr-TR')}`), 400, 80, { align: 'right' });

      // Billed to
      doc.moveDown(3);
      doc.fontSize(11).font(fontBold).text(t('FATURA EDİLEN:'), 50, 130);
      doc.fontSize(10).font(fontReg).text(t(invoice.tenant.publicName || invoice.tenant.name), 50, 145);
      if (invoice.tenant.taxId) doc.text(t(`Vergi No: ${invoice.tenant.taxId}`), 50, 160);
      if (invoice.tenant.address) doc.text(t(invoice.tenant.address), 50, 175, { width: 250 });

      // Line items
      const startY = 230;
      doc.rect(50, startY, 500, 25).fillAndStroke('#f5f5f5', '#ddd');
      doc.fillColor('#000').fontSize(10).font(fontBold)
        .text(t('Açıklama'), 60, startY + 8)
        .text(t('Tutar (TL)'), 460, startY + 8, { width: 80, align: 'right' });

      let y = startY + 30;
      doc.font(fontReg).fontSize(10);

      doc.text(t(`Platform komisyonu (${invoice.bookingCount} bilet, brüt ${Number(invoice.grossTotal).toLocaleString('tr-TR')} TL)`), 60, y, { width: 390 });
      doc.text(Number(invoice.commissionTotal).toLocaleString('tr-TR', { minimumFractionDigits: 2 }), 460, y, { width: 80, align: 'right' });
      y += 20;

      if (Number(invoice.subscriptionFee) > 0) {
        doc.text(t('Aylık plan ücreti'), 60, y);
        doc.text(Number(invoice.subscriptionFee).toLocaleString('tr-TR', { minimumFractionDigits: 2 }), 460, y, { width: 80, align: 'right' });
        y += 20;
      }

      doc.text(t(`KDV (%${Number(invoice.taxRate) * 100})`), 60, y);
      doc.text(Number(invoice.taxAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 }), 460, y, { width: 80, align: 'right' });
      y += 30;

      // Total
      doc.rect(50, y, 500, 30).fillAndStroke('#4f46e5', '#4f46e5');
      doc.fillColor('white').fontSize(12).font(fontBold);
      const total = Number(invoice.commissionTotal) + Number(invoice.subscriptionFee) + Number(invoice.taxAmount);
      doc.text(t('TOPLAM'), 60, y + 10);
      doc.text(`${total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`, 400, y + 10, { width: 140, align: 'right' });

      // Footer
      doc.fillColor('#888').fontSize(8).font(fontReg).text(
        t('Bu fatura elektronik ortamda düzenlenmiştir. Sorularınız için: destek@transitiq.com'),
        50, 780, { align: 'center', width: 500 },
      );

      doc.end();
      stream.on('finish', () => resolve());
      stream.on('error', reject);
    });

    return `/uploads/invoices/${filename}`;
  }

  // ════════════════════════════════════════════════════════════════
  // Risk Scoring (fraud detection)
  // ════════════════════════════════════════════════════════════════

  /** Compute and store a risk score (0-100) for a tenant. */
  async computeTenantRiskScore(tenantId: string): Promise<number> {
    const last30 = new Date(Date.now() - 30 * 86400000);

    const [totalBookings, cancelledBookings, failedRefunds, openComplaints, urgentComplaints] = await Promise.all([
      this.prisma.booking.count({ where: { tenantId, bookingTime: { gte: last30 } } }),
      this.prisma.booking.count({ where: { tenantId, status: 'CANCELLED', bookingTime: { gte: last30 } } }),
      this.prisma.booking.count({ where: { tenantId, refundStatus: 'FAILED' } }),
      this.prisma.complaint.count({ where: { tenantId, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      this.prisma.complaint.count({ where: { tenantId, priority: { in: ['HIGH', 'URGENT'] }, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    ]);

    let score = 0;

    // 1) Cancel rate (0-30 points)
    if (totalBookings > 0) {
      const cancelRate = cancelledBookings / totalBookings;
      if (cancelRate > 0.3) score += 30;
      else if (cancelRate > 0.2) score += 20;
      else if (cancelRate > 0.1) score += 10;
    }

    // 2) Failed refunds (0-20)
    score += Math.min(failedRefunds * 5, 20);

    // 3) Complaints (0-30)
    score += Math.min(openComplaints * 3, 15);
    score += Math.min(urgentComplaints * 5, 15);

    // 4) New tenant boost — first 30 days are higher scrutiny (0-10)
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (tenant) {
      const ageDays = (Date.now() - tenant.createdAt.getTime()) / 86400000;
      if (ageDays < 30) score += 10;
      else if (ageDays < 90) score += 5;
    }

    score = Math.min(100, Math.max(0, score));

    await this.prisma.tenant.update({ where: { id: tenantId }, data: { riskScore: score } });
    return score;
  }

  async computeAllRiskScores() {
    const tenants = await this.prisma.tenant.findMany({ where: { deletedAt: null }, select: { id: true } });
    let done = 0;
    for (const t of tenants) {
      await this.computeTenantRiskScore(t.id).catch(() => {});
      done++;
    }
    return { updated: done, total: tenants.length };
  }

  async getRiskReport() {
    const tenants = await this.prisma.tenant.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, publicName: true, slug: true, logoUrl: true, riskScore: true, createdAt: true, status: true },
      orderBy: { riskScore: 'desc' },
      take: 30,
    });

    // Enrich with indicators
    const enriched = await Promise.all(tenants.map(async (t) => {
      const last30 = new Date(Date.now() - 30 * 86400000);
      const [total, cancelled, refunds, complaints] = await Promise.all([
        this.prisma.booking.count({ where: { tenantId: t.id, bookingTime: { gte: last30 } } }),
        this.prisma.booking.count({ where: { tenantId: t.id, status: 'CANCELLED', bookingTime: { gte: last30 } } }),
        this.prisma.booking.count({ where: { tenantId: t.id, refundStatus: 'FAILED' } }),
        this.prisma.complaint.count({ where: { tenantId: t.id, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      ]);
      return {
        ...t,
        indicators: {
          cancelRate: total > 0 ? Math.round((cancelled / total) * 100) : 0,
          failedRefunds: refunds,
          openComplaints: complaints,
          totalBookings30d: total,
        },
      };
    }));

    return enriched;
  }
}
