import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';

@ApiTags('Tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  /** Download e-ticket as PDF */
  @Get(':pnr/pdf')
  @Throttle({ short: { limit: 5, ttl: 10000 } })
  async downloadPdf(@Param('pnr') pnr: string, @Res() res: Response) {
    if (!pnr || !/^TX-[A-Z0-9]+$/i.test(pnr)) {
      throw new NotFoundException('Geçersiz PNR formatı');
    }

    const buffer = await this.ticketsService.generateTicketPdf(pnr.toUpperCase());

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="TransitIQ-${pnr}.pdf"`,
      'Content-Length': buffer.length,
      'Cache-Control': 'private, no-cache',
    });
    res.end(buffer);
  }
}
