import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { BookingStatus } from '@prisma/client';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';
import * as path from 'path';
import * as fs from 'fs';

function resolveAsset(relativeDir: string, filename: string): string {
  const candidates = [
    path.join(__dirname, relativeDir, filename),
    path.join(process.cwd(), 'src', 'tickets', relativeDir, filename),
    path.join(process.cwd(), 'dist', 'src', 'tickets', relativeDir, filename),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return candidates[0];
}

const FONT_REGULAR = resolveAsset('fonts', 'Regular.ttf');
const FONT_BOLD = resolveAsset('fonts', 'Bold.ttf');
const LOGO_PATH = resolveAsset('assets', 'logo-white.png');
const LOGO_EXISTS = fs.existsSync(LOGO_PATH);

const COLORS = {
  primary: '#4f46e5',
  primaryDark: '#3730a3',
  text: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  bgLight: '#f8fafc',
  success: '#10b981',
  white: '#ffffff',
};

const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateTicketPdf(pnrCode: string): Promise<Buffer> {
    const booking = await this.prisma.booking.findUnique({
      where: { pnrCode },
      include: {
        trip: {
          include: {
            route: {
              include: {
                originStation: true,
                destinationStation: true,
              },
            },
            vehicle: true,
            driver: { select: { name: true } },
          },
        },
        seat: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Bilet bulunamadı');
    }

    return this.buildPdf(booking);
  }

  private async buildPdf(booking: any): Promise<Buffer> {
    const qrDataUrl = await QRCode.toDataURL(booking.pnrCode, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
      color: { dark: '#0f172a', light: '#ffffff' },
    });
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      info: {
        Title: `TransitIQ Bileti - ${booking.pnrCode}`,
        Author: 'TransitIQ',
        Subject: 'E-Bilet',
        Keywords: 'transitiq, bilet, otobus',
      },
    });

    doc.registerFont('Regular', FONT_REGULAR);
    doc.registerFont('Bold', FONT_BOLD);

    const buffers: Buffer[] = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    const finished = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    });

    this.renderPdf(doc, booking, qrBuffer);
    doc.end();

    return finished;
  }

  private renderPdf(doc: PDFKit.PDFDocument, booking: any, qrBuffer: Buffer) {
    const pageWidth = doc.page.width;
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;

    // ─── HEADER (Brand bar) ───
    doc.rect(0, 0, pageWidth, 100).fill(COLORS.primary);

    if (LOGO_EXISTS) {
      doc.image(LOGO_PATH, margin, 22, { height: 46 });
      doc.font('Regular').fontSize(9).fillColor('#e0e7ff')
        .text('Türkiye Genelinde Güvenli ve Konforlu Seyahat', margin, 72);
    } else {
      doc.font('Bold').fontSize(28).fillColor(COLORS.white)
        .text('TransitIQ', margin, 28);
      doc.font('Regular').fontSize(10).fillColor('#dbeafe')
        .text('Türkiye Genelinde Güvenli ve Konforlu Seyahat', margin, 60);
    }

    doc.font('Bold').fontSize(11).fillColor(COLORS.white)
      .text('E-BİLET', margin, 34, { width: contentWidth, align: 'right' });
    doc.font('Regular').fontSize(9).fillColor('#e0e7ff')
      .text(this.formatDate(booking.bookingTime) + ' tarihinde düzenlendi',
        margin, 54, { width: contentWidth, align: 'right' });

    // ─── BOARDING PASS CARD ───
    const cardY = 130;
    const cardHeight = 280;

    doc.roundedRect(margin, cardY, contentWidth, cardHeight, 12)
      .lineWidth(1).stroke(COLORS.border);

    // PNR Banner
    doc.rect(margin, cardY, contentWidth, 50).fill(COLORS.bgLight);
    doc.roundedRect(margin, cardY, contentWidth, 50, 12).fill(COLORS.bgLight);
    doc.rect(margin, cardY + 38, contentWidth, 12).fill(COLORS.bgLight);

    doc.font('Regular').fontSize(9).fillColor(COLORS.muted)
      .text('PNR KODU', margin + 20, cardY + 12);
    doc.font('Bold').fontSize(20).fillColor(COLORS.primary)
      .text(booking.pnrCode, margin + 20, cardY + 22);

    doc.font('Regular').fontSize(9).fillColor(COLORS.muted)
      .text('DURUM', margin, cardY + 12, { width: contentWidth - 20, align: 'right' });

    const statusText = booking.status === BookingStatus.CONFIRMED ? 'ONAYLANDI' : booking.status;
    const statusColor = booking.status === BookingStatus.CONFIRMED ? COLORS.success : COLORS.muted;
    doc.font('Bold').fontSize(13).fillColor(statusColor)
      .text(statusText, margin, cardY + 24, { width: contentWidth - 20, align: 'right' });

    // Origin → Destination Block
    const routeY = cardY + 80;
    const colWidth = (contentWidth - 60) / 2;

    doc.font('Regular').fontSize(9).fillColor(COLORS.muted)
      .text('KALKIŞ', margin + 20, routeY);
    doc.font('Bold').fontSize(22).fillColor(COLORS.text)
      .text(booking.trip.route.originStation.city, margin + 20, routeY + 12);
    doc.font('Regular').fontSize(10).fillColor(COLORS.muted)
      .text(booking.trip.route.originStation.name, margin + 20, routeY + 42, {
        width: colWidth,
      });
    doc.font('Bold').fontSize(14).fillColor(COLORS.text)
      .text(this.formatTime(booking.trip.departureTime), margin + 20, routeY + 65);

    // Arrow / divider
    const arrowY = routeY + 30;
    const arrowX = margin + colWidth + 30;
    doc.font('Bold').fontSize(20).fillColor(COLORS.primary)
      .text('→', arrowX, arrowY);

    doc.font('Regular').fontSize(9).fillColor(COLORS.muted)
      .text('VARIŞ', arrowX + 50, routeY);
    doc.font('Bold').fontSize(22).fillColor(COLORS.text)
      .text(booking.trip.route.destinationStation.city, arrowX + 50, routeY + 12);
    doc.font('Regular').fontSize(10).fillColor(COLORS.muted)
      .text(booking.trip.route.destinationStation.name, arrowX + 50, routeY + 42, {
        width: colWidth,
      });
    if (booking.trip.estimatedArrival) {
      doc.font('Bold').fontSize(14).fillColor(COLORS.text)
        .text(this.formatTime(booking.trip.estimatedArrival), arrowX + 50, routeY + 65);
    }

    // Divider line
    const dividerY = routeY + 100;
    doc.moveTo(margin + 20, dividerY).lineTo(margin + contentWidth - 20, dividerY)
      .lineWidth(0.5).dash(3, { space: 3 }).stroke(COLORS.border).undash();

    // Info Grid: Date | Seat | Vehicle | Passenger
    const infoY = dividerY + 18;
    const cellWidth = (contentWidth - 40) / 4;

    this.drawInfoCell(doc, 'TARİH', this.formatDate(booking.trip.departureTime),
      margin + 20, infoY);
    this.drawInfoCell(doc, 'KOLTUK', String(booking.seat.seatNumber),
      margin + 20 + cellWidth, infoY);
    this.drawInfoCell(doc, 'OTOBÜS', `${booking.trip.vehicle.layoutType} ${booking.trip.vehicle.registrationPlate}`,
      margin + 20 + cellWidth * 2, infoY);
    this.drawInfoCell(doc, 'KOLTUK TİPİ', booking.seat.type === 'VIP' ? 'VIP' : 'Standart',
      margin + 20 + cellWidth * 3, infoY);

    // ─── PASSENGER & QR SECTION ───
    const passengerY = cardY + cardHeight + 20;
    const passengerHeight = 200;

    doc.roundedRect(margin, passengerY, contentWidth, passengerHeight, 12)
      .lineWidth(1).stroke(COLORS.border);

    // Left: Passenger Info
    doc.font('Bold').fontSize(11).fillColor(COLORS.primary)
      .text('YOLCU BİLGİLERİ', margin + 20, passengerY + 20);

    doc.font('Regular').fontSize(9).fillColor(COLORS.muted)
      .text('Ad Soyad', margin + 20, passengerY + 50);
    doc.font('Bold').fontSize(14).fillColor(COLORS.text)
      .text(booking.passengerName, margin + 20, passengerY + 62);

    doc.font('Regular').fontSize(9).fillColor(COLORS.muted)
      .text('T.C. Kimlik No', margin + 20, passengerY + 95);
    doc.font('Bold').fontSize(13).fillColor(COLORS.text)
      .text(this.maskTcNo(booking.passengerTcNo), margin + 20, passengerY + 107);

    doc.font('Regular').fontSize(9).fillColor(COLORS.muted)
      .text('İletişim', margin + 20, passengerY + 140);
    doc.font('Regular').fontSize(10).fillColor(COLORS.text)
      .text(booking.contactEmail, margin + 20, passengerY + 152);
    doc.font('Regular').fontSize(10).fillColor(COLORS.text)
      .text(booking.contactPhone, margin + 20, passengerY + 168);

    // Right: QR Code
    const qrSize = 130;
    const qrX = margin + contentWidth - qrSize - 20;
    const qrY = passengerY + 30;
    doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });

    doc.font('Regular').fontSize(8).fillColor(COLORS.muted)
      .text('Bilet Doğrulama', qrX, qrY + qrSize + 8, { width: qrSize, align: 'center' });

    // ─── PRICE FOOTER ───
    const priceY = passengerY + passengerHeight + 20;
    doc.roundedRect(margin, priceY, contentWidth, 60, 12)
      .fill(COLORS.primary);

    doc.font('Regular').fontSize(10).fillColor('#dbeafe')
      .text('TOPLAM ÖDENEN', margin + 20, priceY + 18);
    doc.font('Bold').fontSize(22).fillColor(COLORS.white)
      .text(`₺ ${this.formatPrice(booking.pricePaid)}`, margin + 20, priceY + 30);

    doc.font('Regular').fontSize(9).fillColor('#dbeafe')
      .text('Ödeme Onaylandı', margin, priceY + 18,
        { width: contentWidth - 20, align: 'right' });
    doc.font('Bold').fontSize(11).fillColor(COLORS.white)
      .text('iyzico Güvenli Ödeme', margin, priceY + 32,
        { width: contentWidth - 20, align: 'right' });

    // ─── TERMS / FOOTER ───
    const termsY = priceY + 80;
    doc.font('Bold').fontSize(9).fillColor(COLORS.text)
      .text('SEYAHAT KOŞULLARI', margin, termsY);

    const terms = [
      'Sefer saatinden 15 dakika önce kalkış noktasında hazır bulununuz.',
      'Yanınızda bu biletin çıktısı veya QR kodu ile birlikte kimlik belgenizi bulundurunuz.',
      'Bilet iptal/değişiklik talepleri için sefer saatinden en geç 6 saat önce başvurunuz.',
      '12 yaş altı çocuklar refakatçi eşliğinde seyahat etmelidir.',
    ];

    doc.font('Regular').fontSize(8).fillColor(COLORS.muted);
    let termY = termsY + 14;
    terms.forEach((t) => {
      doc.text(`•  ${t}`, margin, termY, { width: contentWidth });
      termY += 14;
    });

    // Footer brand
    const footerY = doc.page.height - 50;
    doc.moveTo(margin, footerY).lineTo(margin + contentWidth, footerY)
      .lineWidth(0.5).stroke(COLORS.border);
    doc.font('Regular').fontSize(8).fillColor(COLORS.muted)
      .text(`© ${new Date().getFullYear()} TransitIQ Ulaşım Teknolojileri A.Ş. — destek@transitiq.com`,
        margin, footerY + 12, { width: contentWidth, align: 'center' });
  }

  private drawInfoCell(doc: PDFKit.PDFDocument, label: string, value: string, x: number, y: number) {
    doc.font('Regular').fontSize(8).fillColor(COLORS.muted).text(label, x, y);
    doc.font('Bold').fontSize(12).fillColor(COLORS.text).text(value, x, y + 12);
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

  private formatPrice(p: any): string {
    const num = typeof p === 'object' && p.toNumber ? p.toNumber() : Number(p);
    return num.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private maskTcNo(tc: string): string {
    if (!tc || tc.length !== 11) return tc;
    return `${tc.substring(0, 3)}*****${tc.substring(8)}`;
  }
}
