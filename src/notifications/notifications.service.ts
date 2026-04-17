import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import * as React from 'react';
import * as fs from 'fs';
import * as path from 'path';
import { TicketConfirmationEmail } from './templates/ticket-confirmation';
import { TicketsService } from '../tickets/tickets.service';
import { PrismaService } from '../common/prisma/prisma.service';

function resolveLogoBuffer(): Buffer | null {
  const candidates = [
    path.join(__dirname, 'templates', 'logo-email.png'),
    path.join(process.cwd(), 'src', 'notifications', 'templates', 'logo-email.png'),
    path.join(process.cwd(), 'dist', 'src', 'notifications', 'templates', 'logo-email.png'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return fs.readFileSync(p);
    }
  }
  return null;
}

const LOGO_BUFFER = resolveLogoBuffer();
const LOGO_CID = 'transitiq-logo-2026';

const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly resend: Resend | null;
  private readonly fromAddress: string;
  private readonly supportEmail: string;
  private readonly enabled: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly ticketsService: TicketsService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    this.fromAddress = this.config.get<string>('EMAIL_FROM', 'TransitIQ <onboarding@resend.dev>');
    this.supportEmail = this.config.get<string>('EMAIL_SUPPORT', 'destek@transitiq.com');
    this.enabled = !!apiKey;
    this.resend = apiKey ? new Resend(apiKey) : null;

    if (!this.enabled) {
      this.logger.warn('RESEND_API_KEY missing — email notifications disabled');
    } else {
      this.logger.log(`[EMAIL] Resend enabled, sending from: ${this.fromAddress}`);
    }
  }

  /**
   * Send 24h-before trip reminder email.
   */
  async sendTripReminder(booking: any) {
    if (!this.enabled || !this.resend) return;
    const depTime = new Date(booking.trip.departureTime);
    const dateStr = depTime.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = depTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const origin = booking.trip.route.originStation;
    const dest = booking.trip.route.destinationStation;

    const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;background:#f1f5f9;padding:40px 20px;margin:0"><div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,0.05)">
      <h1 style="font-size:22px;font-weight:900;margin:0 0 8px;color:#0f172a">Yarın yola çıkıyorsun! 🚌</h1>
      <p style="color:#475569;line-height:1.6;margin:0 0 24px">Merhaba ${escapeHtml(booking.passengerName)}, biletini hatırlatıyoruz.</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:20px">
        <p style="color:#0f172a;font-weight:800;font-size:18px;margin:0 0 8px">${escapeHtml(origin.city)} → ${escapeHtml(dest.city)}</p>
        <p style="color:#64748b;font-size:13px;margin:0"><strong>${dateStr}</strong> · Kalkış saat <strong>${timeStr}</strong></p>
        <p style="color:#64748b;font-size:13px;margin:6px 0 0">Kalkış: ${escapeHtml(origin.name)}</p>
        <p style="color:#64748b;font-size:13px;margin:6px 0 0">Koltuk: <strong>${booking.seatId ? '—' : '—'}</strong> · Plaka: ${escapeHtml(booking.trip.vehicle.registrationPlate)}</p>
        <p style="color:#64748b;font-size:13px;margin:6px 0 0">PNR: <strong style="font-family:monospace;letter-spacing:1px">${escapeHtml(booking.pnrCode)}</strong></p>
      </div>
      <p style="color:#475569;font-size:13px;line-height:1.6;margin:0 0 20px">Otogara kalkıştan <strong>en az 15 dakika önce</strong> gelmeni öneririz. Biniş için PNR kodunu ve kimliğini hazır bulundur.</p>
      <p style="color:#94a3b8;font-size:11px;margin:24px 0 0">İyi yolculuklar! ✨</p>
    </div></body></html>`;

    try {
      await this.resend.emails.send({
        from: this.fromAddress, to: booking.contactEmail,
        subject: `Yarın yolculuk — ${origin.city} → ${dest.city}`,
        html,
      });
    } catch (err) {
      this.logger.error(`[REMINDER] Failed: ${err}`);
    }
  }

  /**
   * Send weekly revenue report to admins every Monday.
   */
  async sendWeeklyRevenueReport(to: string, adminName: string, data: { tenantName: string; revenue: number; bookings: number; cancelled: number; from: Date; to: Date }) {
    if (!this.enabled || !this.resend) return;
    const fmtDate = (d: Date) => d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
    const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;background:#f1f5f9;padding:40px 20px;margin:0"><div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,0.05)">
      <h1 style="font-size:22px;font-weight:900;margin:0 0 4px;color:#0f172a">Haftalık Özet 📊</h1>
      <p style="color:#94a3b8;font-size:12px;margin:0 0 24px">${fmtDate(data.from)} — ${fmtDate(data.to)} · ${escapeHtml(data.tenantName)}</p>
      <div style="display:flex;gap:12px;margin-bottom:24px">
        <div style="flex:1;background:#eef2ff;border-radius:12px;padding:16px;text-align:center">
          <p style="color:#4f46e5;font-size:24px;font-weight:900;margin:0">₺${data.revenue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</p>
          <p style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:4px 0 0">Haftalık Ciro</p>
        </div>
        <div style="flex:1;background:#ecfdf5;border-radius:12px;padding:16px;text-align:center">
          <p style="color:#10b981;font-size:24px;font-weight:900;margin:0">${data.bookings}</p>
          <p style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:4px 0 0">Bilet Satışı</p>
        </div>
        <div style="flex:1;background:#fef2f2;border-radius:12px;padding:16px;text-align:center">
          <p style="color:#ef4444;font-size:24px;font-weight:900;margin:0">${data.cancelled}</p>
          <p style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:4px 0 0">İptal</p>
        </div>
      </div>
      <p style="color:#475569;font-size:13px;line-height:1.6;margin:0 0 20px">Merhaba ${escapeHtml(adminName)}, geçen haftaya ait özet raporun hazır. Detaylı analiz için <a href="${this.frontendUrl()}/admin" style="color:#4f46e5;font-weight:700">admin paneline</a> gelebilirsin.</p>
      <p style="color:#94a3b8;font-size:11px;margin:24px 0 0">TransitIQ — Otomatik haftalık rapor</p>
    </div></body></html>`;

    try {
      await this.resend.emails.send({
        from: this.fromAddress, to,
        subject: `📊 Haftalık Özet — ${escapeHtml(data.tenantName)}`,
        html,
      });
    } catch (err) {
      this.logger.error(`[WEEKLY REPORT] Failed: ${err}`);
    }
  }

  private frontendUrl(): string {
    return this.config.get<string>('FRONTEND_URL', 'http://localhost:3001');
  }

  /**
   * Send booking confirmation email with PDF tickets attached.
   * Called after a successful reservation.
   */
  /**
   * Send a password reset email with a time-limited link.
   */
  async sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
    if (!this.enabled || !this.resend) {
      this.logger.warn(`[EMAIL] Password reset skipped — RESEND_API_KEY missing. Would have sent to: ${to}`);
      return;
    }
    try {
      const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;background:#f1f5f9;padding:40px 20px;margin:0"><div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,0.05)">
        <h1 style="font-size:22px;font-weight:900;margin:0 0 16px;color:#0f172a">Şifreni sıfırla</h1>
        <p style="color:#475569;line-height:1.6;margin:0 0 20px">Merhaba ${escapeHtml(name)},</p>
        <p style="color:#475569;line-height:1.6;margin:0 0 24px">TransitIQ hesabın için şifre sıfırlama talebi aldık. Aşağıdaki butona tıklayarak yeni şifreni oluşturabilirsin. Bu link <strong>30 dakika</strong> içinde geçerliliğini yitirir.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#4f46e5;color:white;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:700;font-size:14px">Şifremi Sıfırla</a>
        <p style="color:#94a3b8;font-size:12px;line-height:1.5;margin:32px 0 0">Bu talebi sen yapmadıysan bu e-postayı yok sayabilirsin — hesabına kimse erişemedi.</p>
        <hr style="border:0;border-top:1px solid #e2e8f0;margin:28px 0" />
        <p style="color:#94a3b8;font-size:11px;margin:0">Bağlantı çalışmıyorsa bu adresi tarayıcıya yapıştır:<br><span style="word-break:break-all">${escapeHtml(resetUrl)}</span></p>
      </div></body></html>`;

      const result: any = await this.resend.emails.send({
        from: this.fromAddress,
        to,
        subject: 'TransitIQ Şifre Sıfırlama',
        html,
      });

      if (result?.error) {
        this.logger.error(`[EMAIL] Resend returned error for ${to}: ${JSON.stringify(result.error)}`);
        if (String(result.error?.message || '').toLowerCase().includes('domain')) {
          this.logger.warn(`[EMAIL] Note: Resend's default sender (onboarding@resend.dev) only delivers to the address registered with your Resend account. Verify a domain + set EMAIL_FROM to that domain to send to arbitrary recipients.`);
        }
      } else {
        this.logger.log(`[EMAIL] Password reset sent to ${to} (id=${result?.data?.id || 'unknown'})`);
      }
    } catch (err) {
      this.logger.error(`[EMAIL] sendPasswordResetEmail threw: ${err instanceof Error ? err.message : err}`);
    }
  }

  /**
   * Send an email verification link after registration.
   */
  async sendEmailVerification(to: string, name: string, verifyUrl: string) {
    if (!this.enabled || !this.resend) {
      this.logger.warn(`Email verification not sent (Resend disabled): ${to}`);
      return;
    }
    try {
      const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;background:#f1f5f9;padding:40px 20px;margin:0"><div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,0.05)">
        <h1 style="font-size:22px;font-weight:900;margin:0 0 16px;color:#0f172a">E-posta adresini doğrula</h1>
        <p style="color:#475569;line-height:1.6;margin:0 0 20px">Merhaba ${escapeHtml(name)},</p>
        <p style="color:#475569;line-height:1.6;margin:0 0 24px">TransitIQ'ya hoş geldin! Hesabını aktifleştirmek için aşağıdaki butona tıkla. Link <strong>24 saat</strong> geçerlidir.</p>
        <a href="${verifyUrl}" style="display:inline-block;background:#10b981;color:white;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:700;font-size:14px">E-postamı Doğrula</a>
        <p style="color:#94a3b8;font-size:12px;line-height:1.5;margin:32px 0 0">Bu e-postayı beklemiyor musun? Birisi yanlışlıkla adresini girmiş olabilir; yok sayabilirsin.</p>
        <hr style="border:0;border-top:1px solid #e2e8f0;margin:28px 0" />
        <p style="color:#94a3b8;font-size:11px;margin:0">Bağlantı çalışmıyorsa:<br><span style="word-break:break-all">${escapeHtml(verifyUrl)}</span></p>
      </div></body></html>`;

      await this.resend.emails.send({
        from: this.fromAddress,
        to,
        subject: 'TransitIQ E-posta Doğrulama',
        html,
      });
      this.logger.log(`Verification email sent to ${to}`);
    } catch (err) {
      this.logger.error(`sendEmailVerification failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  /**
   * Notify a waiting-list member that a seat has opened up.
   * Links directly to the seat-selection step with the trip preselected.
   */
  async sendSeatAvailable(args: {
    to: string;
    name: string;
    tripId: string;
    origin: string;
    destination: string;
    departureTime: Date;
    availableSeats: number;
  }) {
    if (!this.enabled || !this.resend) {
      this.logger.warn(`[EMAIL] Seat-available skipped — RESEND_API_KEY missing. Would have notified: ${args.to}`);
      return;
    }
    try {
      const baseUrl = this.config.get<string>('FRONTEND_URL', 'https://transitiq.com');
      const dep = new Date(args.departureTime);
      const dateStr = `${dep.getDate()} ${MONTHS_TR[dep.getMonth()]} ${dep.getFullYear()}`;
      const timeStr = dep.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      const deepLink = `${baseUrl}/search?from=${encodeURIComponent(args.origin)}&to=${encodeURIComponent(args.destination)}&date=${dep.toISOString().slice(0, 10)}&tripId=${args.tripId}`;

      const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;background:#f1f5f9;padding:40px 20px;margin:0"><div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,0.05)">
        <div style="display:inline-block;background:#ecfdf5;color:#047857;padding:6px 12px;border-radius:999px;font-size:11px;font-weight:800;letter-spacing:0.04em;margin-bottom:16px">KOLTUK AÇILDI</div>
        <h1 style="font-size:22px;font-weight:900;margin:0 0 12px;color:#0f172a">${escapeHtml(args.origin)} → ${escapeHtml(args.destination)}</h1>
        <p style="color:#475569;line-height:1.6;margin:0 0 20px">Merhaba ${escapeHtml(args.name)}, beklediğin seferde koltuk açıldı! Hemen rezervasyon yapabilirsin — ilk gelen kapar, o yüzden hızlı olmalısın.</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:20px 0">
          <p style="margin:0 0 6px;color:#94a3b8;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase">Sefer detayı</p>
          <p style="margin:0 0 4px;color:#0f172a;font-size:16px;font-weight:800">${dateStr} · ${timeStr}</p>
          <p style="margin:0;color:#64748b;font-size:13px">${args.availableSeats} koltuk mevcut</p>
        </div>
        <a href="${deepLink}" style="display:inline-block;background:#10b981;color:white;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:700;font-size:14px">Koltuğumu Al</a>
        <p style="color:#94a3b8;font-size:12px;line-height:1.5;margin:32px 0 8px">Artık bu seferle ilgilenmiyorsan e-postayı yok sayabilirsin — listeden çıkmak için hesabındaki "Bekleme Listem" sayfasını kullanabilirsin.</p>
        <hr style="border:0;border-top:1px solid #e2e8f0;margin:24px 0" />
        <p style="color:#94a3b8;font-size:11px;margin:0">Bağlantı çalışmıyorsa:<br><span style="word-break:break-all">${escapeHtml(deepLink)}</span></p>
      </div></body></html>`;

      const result: any = await this.resend.emails.send({
        from: this.fromAddress,
        to: args.to,
        subject: `Koltuk açıldı — ${args.origin} → ${args.destination} (${dateStr})`,
        html,
      });

      if (result?.error) {
        this.logger.error(`[EMAIL] Seat-available Resend error for ${args.to}: ${JSON.stringify(result.error)}`);
      } else {
        this.logger.log(`[EMAIL] Seat-available sent to ${args.to} (id=${result?.data?.id || 'unknown'})`);
      }
    } catch (err) {
      this.logger.error(`[EMAIL] sendSeatAvailable threw: ${err instanceof Error ? err.message : err}`);
    }
  }

  async sendBookingConfirmation(pnrCodes: string[]) {
    if (!this.enabled || !this.resend || pnrCodes.length === 0) return;

    try {
      // Fetch all bookings (one query per PNR — small N, acceptable)
      const bookings = await Promise.all(
        pnrCodes.map((pnr) =>
          this.prisma.booking.findUnique({
            where: { pnrCode: pnr },
            include: {
              trip: {
                include: {
                  route: { include: { originStation: true, destinationStation: true } },
                  vehicle: true,
                },
              },
              seat: true,
            },
          }),
        ),
      );

      const valid = bookings.filter((b): b is NonNullable<typeof b> => b !== null);
      if (valid.length === 0) return;

      const first = valid[0];
      const totalPaidNum = valid.reduce((sum, b) => sum + Number(b.pricePaid), 0);

      // Build PDF attachments (all tickets)
      const attachments = await Promise.all(
        valid.map(async (b) => ({
          filename: `TransitIQ-${b.pnrCode}.pdf`,
          content: await this.ticketsService.generateTicketPdf(b.pnrCode),
        })),
      );

      // Render email HTML — use cid: reference for inline logo
      const html = await render(
        React.createElement(TicketConfirmationEmail, {
          logoDataUrl: LOGO_BUFFER ? `cid:${LOGO_CID}` : '',
          passengerName: first.passengerName,
          pnrCodes: valid.map((b) => b.pnrCode),
          origin: first.trip.route.originStation.city,
          destination: first.trip.route.destinationStation.city,
          originStation: first.trip.route.originStation.name,
          destinationStation: first.trip.route.destinationStation.name,
          departureDate: this.formatDate(first.trip.departureTime),
          departureTime: this.formatTime(first.trip.departureTime),
          arrivalTime: first.trip.estimatedArrival ? this.formatTime(first.trip.estimatedArrival) : '—',
          seatNumbers: valid.map((b) => b.seat.seatNumber),
          busInfo: `${first.trip.vehicle.layoutType} ${first.trip.vehicle.registrationPlate}`,
          totalPaid: `₺ ${totalPaidNum.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
          ticketCount: valid.length,
          supportEmail: this.supportEmail,
        }),
      );

      const subject =
        valid.length > 1
          ? `${valid.length} biletiniz hazır — ${first.trip.route.originStation.city} → ${first.trip.route.destinationStation.city}`
          : `Biletiniz hazır — PNR: ${first.pnrCode}`;

      const allAttachments: Array<{
        filename: string;
        content: Buffer;
        contentType?: string;
        contentId?: string;
        contentDisposition?: 'attachment' | 'inline';
      }> = attachments.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: 'application/pdf',
        contentDisposition: 'attachment',
      }));

      // Inline logo via Content-ID (referenced by `cid:LOGO_CID` in HTML)
      if (LOGO_BUFFER) {
        allAttachments.push({
          filename: 'transitiq-logo.png',
          content: LOGO_BUFFER,
          contentType: 'image/png',
          contentId: LOGO_CID,
          contentDisposition: 'inline',
        });
      }

      const result = await this.resend.emails.send({
        from: this.fromAddress,
        to: first.contactEmail,
        subject,
        html,
        attachments: allAttachments as any,
      });

      if (result.error) {
        this.logger.error(`Failed to send confirmation email to ${first.contactEmail}: ${JSON.stringify(result.error)}`);
      } else {
        this.logger.log(`Sent confirmation email (id=${result.data?.id}) to ${first.contactEmail} with ${attachments.length} ticket(s)`);
      }
    } catch (err) {
      this.logger.error(`sendBookingConfirmation failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  private formatDate(d: Date | string): string {
    const date = new Date(d);
    return `${date.getDate()} ${MONTHS_TR[date.getMonth()]} ${date.getFullYear()}`;
  }

  private formatTime(d: Date | string): string {
    return new Date(d).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Istanbul',
    });
  }

  /**
   * Send a contact form message to support + confirmation to sender.
   */
  async sendContactMessage(data: { name: string; email: string; subject: string; message: string }) {
    if (!this.enabled || !this.resend) {
      this.logger.warn('Contact form received but Resend not configured');
      return { ok: false, reason: 'mail-disabled' };
    }

    const escape = (s: string) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const bodyHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0f172a;">
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 24px; border-radius: 16px 16px 0 0; color: white;">
          <h2 style="margin: 0; font-size: 18px;">Yeni iletişim formu mesajı</h2>
          <p style="margin: 6px 0 0 0; font-size: 12px; opacity: 0.8;">TransitIQ web sitesinden</p>
        </div>
        <div style="background: #f8fafc; padding: 20px; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0; border-top: none;">
          <table style="width:100%; font-size: 13px;">
            <tr><td style="padding:6px 0; color:#64748b; width:100px;">Gönderen:</td><td style="padding:6px 0; font-weight:600;">${escape(data.name)}</td></tr>
            <tr><td style="padding:6px 0; color:#64748b;">E-posta:</td><td style="padding:6px 0; font-weight:600;">${escape(data.email)}</td></tr>
            <tr><td style="padding:6px 0; color:#64748b;">Konu:</td><td style="padding:6px 0; font-weight:600;">${escape(data.subject)}</td></tr>
          </table>
          <hr style="border:none; border-top:1px solid #e2e8f0; margin: 16px 0;" />
          <p style="margin:0; white-space: pre-wrap; line-height: 1.6;">${escape(data.message)}</p>
        </div>
      </div>
    `;

    try {
      // Send to support inbox
      await this.resend.emails.send({
        from: this.fromAddress,
        to: this.supportEmail,
        subject: `[İletişim] ${data.subject}`,
        html: bodyHtml,
        replyTo: data.email,
      });

      // Auto-reply to sender
      const replyHtml = `
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0f172a;">
          <div style="background: linear-gradient(135deg, #4f46e5, #3730a3); padding: 28px; border-radius: 16px; color:white; text-align:center;">
            <h2 style="margin:0 0 8px 0;">Mesajını aldık, ${escape(data.name.split(' ')[0])}!</h2>
            <p style="margin:0; opacity:0.9; font-size:13px;">En kısa sürede seni geri arayacağız.</p>
          </div>
          <p style="margin-top: 20px; color:#64748b; font-size:13px; line-height:1.6;">
            İletişim formundan gönderdiğin <strong>&quot;${escape(data.subject)}&quot;</strong> konulu mesaj ekibimize ulaştı.
            Genellikle 1 iş günü içinde dönüş yaparız.
          </p>
          <p style="color:#94a3b8; font-size:11px; margin-top:20px;">Bu otomatik bir yanıttır. Lütfen bu e-postaya yanıt verme.</p>
        </div>
      `;
      await this.resend.emails.send({
        from: this.fromAddress,
        to: data.email,
        subject: 'Mesajınızı aldık — TransitIQ',
        html: replyHtml,
      });

      this.logger.log(`Contact message from ${data.email} forwarded to ${this.supportEmail}`);
      return { ok: true };
    } catch (err) {
      this.logger.error(`Contact form send failed: ${err instanceof Error ? err.message : err}`);
      return { ok: false, reason: 'send-failed' };
    }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
