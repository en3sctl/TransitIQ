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
    }
  }

  /**
   * Send booking confirmation email with PDF tickets attached.
   * Called after a successful reservation.
   */
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
