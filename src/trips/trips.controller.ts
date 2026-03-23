import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/trip.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Trips')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  async findAll(@Req() req: any) {
    return this.tripsService.findAll(req.user.tenantId);
  }

  @Post()
  async create(@Req() req: any, @Body() createTripDto: CreateTripDto) {
    return this.tripsService.create(req.user.tenantId, createTripDto);
  }
}
