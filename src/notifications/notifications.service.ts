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
}
