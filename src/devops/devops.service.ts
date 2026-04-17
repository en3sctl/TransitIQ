import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class DevopsService {
  private readonly logger = new Logger(DevopsService.name);

  constructor(private prisma: PrismaService) {}

  // ════════════════════════════════════════════════════════════════
  // Email Templates
  // ════════════════════════════════════════════════════════════════

  async listEmailTemplates() {
    return this.prisma.emailTemplate.findMany({ orderBy: { key: 'asc' } });
  }

  async getEmailTemplate(key: string) {
    return this.prisma.emailTemplate.findUnique({ where: { key } });
  }

  async upsertEmailTemplate(key: string, data: {
    name: string; subject: string; bodyHtml: string; variables?: any; description?: string; updatedBy?: string;
  }) {
    return this.prisma.emailTemplate.upsert({
      where: { key },
      create: {
        key,
        name: data.name,
        subject: data.subject,
        bodyHtml: data.bodyHtml,
        variables: data.variables || [],
        description: data.description || null,
        updatedBy: data.updatedBy || null,
      },
      update: {
        name: data.name,
        subject: data.subject,
        bodyHtml: data.bodyHtml,
        variables: data.variables,
        description: data.description,
        updatedBy: data.updatedBy,
      },
    });
  }

  async deleteEmailTemplate(key: string) {
    return this.prisma.emailTemplate.delete({ where: { key } });
  }

  async seedEmailTemplates() {
    const defaults = [
      {
        key: 'WELCOME',
        name: 'Hoş Geldin',
        subject: 'TransitIQ\'a hoş geldin {{name}}!',
        bodyHtml: `<h1>Merhaba {{name}},</h1><p>TransitIQ ailesine katıldığın için teşekkürler. İlk biletini bulmak için <a href="{{siteUrl}}">siteye git</a>.</p>`,
        description: 'Yeni yolcu kaydolunca gönderilir',
        variables: ['name', 'siteUrl'],
      },
      {
        key: 'TENANT_APPROVED',
        name: 'Firma Onaylandı',
        subject: '{{companyName}} — TransitIQ başvurunuz onaylandı',
        bodyHtml: `<h1>Tebrikler!</h1><p>{{companyName}} firma başvurunuz platform ekibi tarafından onaylandı. Artık admin paneline giriş yapıp araç ve sefer ekleyebilirsiniz.</p><p><a href="{{adminUrl}}">Admin Paneline Git</a></p>`,
        description: 'Firma başvurusu onaylandığında firma adminine gider',
        variables: ['companyName', 'adminUrl'],
      },
      {
        key: 'TENANT_REJECTED',
        name: 'Firma Reddedildi',
        subject: '{{companyName}} başvurunuz hakkında',
        bodyHtml: `<p>Merhaba,</p><p>{{companyName}} başvurunuz şu an onaylanamadı. Sebep: {{reason}}</p><p>İletişim: destek@transitiq.com</p>`,
        description: 'Firma başvurusu reddedildiğinde gider',
        variables: ['companyName', 'reason'],
      },
      {
        key: 'INVOICE_SENT',
        name: 'Fatura Bilgilendirme',
        subject: '{{invoiceNo}} numaralı faturanız',
        bodyHtml: `<h2>Fatura: {{invoiceNo}}</h2><p>Dönem: {{period}}</p><p>Tutar: {{amount}} TL</p><p><a href="{{pdfUrl}}">PDF olarak indir</a></p>`,
        description: 'Aylık komisyon faturası firma adminine gider',
        variables: ['invoiceNo', 'period', 'amount', 'pdfUrl'],
      },
    ];
    let created = 0;
    for (const t of defaults) {
      const existing = await this.prisma.emailTemplate.findUnique({ where: { key: t.key } });
      if (!existing) {
        await this.prisma.emailTemplate.create({ data: { ...t, variables: t.variables } });
        created++;
      }
    }
    return { created, total: defaults.length };
  }

  // ════════════════════════════════════════════════════════════════
  // Feature Flags
  // ════════════════════════════════════════════════════════════════

  async listFlags() {
    return this.prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
  }

  async upsertFlag(key: string, data: {
    name: string; description?: string; enabled?: boolean;
    audience?: string; rolloutPct?: number; tenantIds?: string[];
  }) {
    return this.prisma.featureFlag.upsert({
      where: { key },
      create: {
        key,
        name: data.name,
        description: data.description || null,
        enabled: data.enabled ?? false,
        audience: data.audience || 'ALL',
        rolloutPct: data.rolloutPct ?? 100,
        tenantIds: data.tenantIds || [],
      },
      update: {
        name: data.name,
        description: data.description,
        enabled: data.enabled,
        audience: data.audience,
        rolloutPct: data.rolloutPct,
        tenantIds: data.tenantIds,
      },
    });
  }

  async deleteFlag(key: string) {
    return this.prisma.featureFlag.delete({ where: { key } });
  }

  /**
   * Public endpoint: returns the set of enabled flags for a given tenant.
   * Used by frontend to toggle experimental features.
   */
  async resolveFlags(tenantId?: string): Promise<Record<string, boolean>> {
    const all = await this.prisma.featureFlag.findMany({ where: { enabled: true } });
    const result: Record<string, boolean> = {};
    for (const f of all) {
      if (f.audience === 'ALL') result[f.key] = true;
      else if (f.audience === 'TENANT_IDS') result[f.key] = tenantId ? f.tenantIds.includes(tenantId) : false;
      else if (f.audience === 'PERCENTAGE') {
        if (!tenantId) { result[f.key] = false; continue; }
        // Deterministic hash bucket based on tenantId
        const hash = crypto.createHash('sha256').update(tenantId + f.key).digest('hex');
        const bucket = parseInt(hash.slice(0, 8), 16) % 100;
        result[f.key] = bucket < f.rolloutPct;
      }
    }
    return result;
  }

  // ════════════════════════════════════════════════════════════════
  // API Keys
  // ════════════════════════════════════════════════════════════════

  async listApiKeys(tenantId: string) {
    return this.prisma.apiKey.findMany({
      where: { tenantId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, keyPrefix: true, scopes: true,
        lastUsedAt: true, expiresAt: true, createdAt: true,
      },
    });
  }

  async createApiKey(tenantId: string, createdBy: string, data: {
    name: string; scopes?: string[]; expiresInDays?: number;
  }) {
    if (!data.name) throw new BadRequestException('Ad gerekli');
    // Format: tiq_live_<random>
    const raw = crypto.randomBytes(24).toString('base64url');
    const fullKey = `tiq_live_${raw}`;
    const keyHash = crypto.createHash('sha256').update(fullKey).digest('hex');
    const keyPrefix = fullKey.slice(0, 12) + '...' + fullKey.slice(-4);

    const expiresAt = data.expiresInDays
      ? new Date(Date.now() + data.expiresInDays * 86400 * 1000)
      : null;

    const record = await this.prisma.apiKey.create({
      data: {
        tenantId,
        name: data.name.trim().slice(0, 80),
        keyHash,
        keyPrefix,
        scopes: data.scopes || [],
        expiresAt,
        createdBy,
      },
    });

    // Return full key ONCE — never shown again
    return {
      ...record,
      key: fullKey,
      warning: 'Bu anahtarı güvenli bir yere kaydet — bir daha gösterilmez.',
    };
  }

  async revokeApiKey(tenantId: string, id: string) {
    const k = await this.prisma.apiKey.findUnique({ where: { id } });
    if (!k || k.tenantId !== tenantId) throw new NotFoundException();
    return this.prisma.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
  }

  /** Verify a raw API key and return the associated tenant. */
  async authenticateApiKey(rawKey: string) {
    if (!rawKey.startsWith('tiq_live_')) return null;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const record = await this.prisma.apiKey.findUnique({
      where: { keyHash },
      include: { tenant: { select: { id: true, name: true, status: true } } },
    });
    if (!record || record.revokedAt) return null;
    if (record.expiresAt && record.expiresAt < new Date()) return null;
    if (record.tenant.status !== 'ACTIVE') return null;
    // Touch lastUsedAt
    await this.prisma.apiKey.update({ where: { id: record.id }, data: { lastUsedAt: new Date() } });
    return record;
  }

  // ════════════════════════════════════════════════════════════════
  // Incidents
  // ════════════════════════════════════════════════════════════════

  async listIncidents(opts: { status?: string; take?: number } = {}) {
    const { status, take = 50 } = opts;
    const where: any = {};
    if (status) where.status = status;
    return this.prisma.incident.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take,
      include: {
        updates: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
  }

  async listPublicIncidents() {
    // Only ongoing + last resolved for public status page
    const [ongoing, recent] = await Promise.all([
      this.prisma.incident.findMany({
        where: { status: { not: 'RESOLVED' } },
        orderBy: { startedAt: 'desc' },
        include: { updates: { orderBy: { createdAt: 'desc' }, take: 5 } },
      }),
      this.prisma.incident.findMany({
        where: { status: 'RESOLVED' },
        orderBy: { resolvedAt: 'desc' },
        take: 5,
      }),
    ]);
    return { ongoing, recent };
  }

  async createIncident(createdBy: string, data: {
    title: string; description: string; severity?: string;
    affectedServices?: string[]; publicMessage?: string;
  }) {
    if (!data.title || !data.description) throw new BadRequestException('Başlık ve açıklama gerekli');
    return this.prisma.incident.create({
      data: {
        title: data.title,
        description: data.description,
        severity: data.severity || 'MAJOR',
        affectedServices: data.affectedServices || [],
        publicMessage: data.publicMessage || null,
        createdBy,
      },
    });
  }

  async addIncidentUpdate(incidentId: string, data: { status: string; message: string }) {
    const valid = ['INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED'];
    if (!valid.includes(data.status)) throw new BadRequestException('Geçersiz durum');
    const update = await this.prisma.incidentUpdate.create({
      data: { incidentId, status: data.status, message: data.message },
    });
    await this.prisma.incident.update({
      where: { id: incidentId },
      data: {
        status: data.status,
        resolvedAt: data.status === 'RESOLVED' ? new Date() : undefined,
      },
    });
    return update;
  }

  async deleteIncident(id: string) {
    return this.prisma.incident.delete({ where: { id } });
  }
}
