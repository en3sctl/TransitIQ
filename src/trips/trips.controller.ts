import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/trip.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Trips')
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  async findAll(@Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.tripsService.findAll(tenantId);
  }

  @Post()
  async create(@Req() req: any, @Body() createTripDto: CreateTripDto) {
    try {
      const tenantId = req.user.tenantId;
      return await this.tripsService.create(tenantId, createTripDto);
    } catch (error) {
      console.error('--- Prisma create error in TripsController ---');
      console.error(error);
      throw error;
    }
  }
}
