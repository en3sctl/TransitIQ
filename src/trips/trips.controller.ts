import { Controller, Get, Post, Patch, Delete, Body, Param, Req, Query, UseGuards } from '@nestjs/common';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/trip.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Trips')
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  /** Public: cheapest upcoming trips for landing page */
  @Get('public/cheap')
  findCheapPublic(@Query('limit') limit?: string) {
    return this.tripsService.findCheapPublic(limit ? Number(limit) : 6);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findAll(@Req() req: any) {
    return this.tripsService.findAll(req.user.tenantId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async create(@Req() req: any, @Body() createTripDto: CreateTripDto) {
    return this.tripsService.create(req.user.tenantId, createTripDto, req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { driverId?: string; vehicleId?: string; departureTime?: string; estimatedArrival?: string; status?: string; notes?: string },
  ) {
    return this.tripsService.update(req.user.tenantId, req.user.id, id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async remove(@Req() req: any, @Param('id') id: string) {
    return this.tripsService.cancelTrip(req.user.tenantId, req.user.id, id);
  }
}
