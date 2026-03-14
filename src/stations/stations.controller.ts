import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { StationsService } from './stations.service';
import { CreateStationDto, UpdateStationDto } from './dto/station.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Stations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stations')
export class StationsController {
  constructor(private readonly stationsService: StationsService) {}

  @Post()
  create(@Request() req: any, @Body() createDto: CreateStationDto) {
    return this.stationsService.create(req.user.tenantId, createDto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.stationsService.findAll(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.stationsService.findOne(req.user.tenantId, id);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() updateDto: UpdateStationDto) {
    return this.stationsService.update(req.user.tenantId, id, updateDto);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.stationsService.remove(req.user.tenantId, id);
  }
}
