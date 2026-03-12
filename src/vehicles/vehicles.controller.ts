import { Controller, Get, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto/vehicle.dto';

import { ApiTags } from '@nestjs/swagger';

@ApiTags('Vehicles')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  // NOTE: tenantId will be extracted from the request user object
  // Mocking the user for now until Auth is implemented

  @Post()
  create(@Request() req: any, @Body() createVehicleDto: CreateVehicleDto) {
    const tenantId = req.user?.tenantId || 'dummy-tenant-id';
    return this.vehiclesService.create(tenantId, createVehicleDto);
  }

  @Get()
  findAll(@Request() req: any) {
    const tenantId = req.user?.tenantId || 'dummy-tenant-id';
    return this.vehiclesService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenantId || 'dummy-tenant-id';
    return this.vehiclesService.findOne(tenantId, id);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() updateVehicleDto: UpdateVehicleDto) {
    const tenantId = req.user?.tenantId || 'dummy-tenant-id';
    return this.vehiclesService.update(tenantId, id, updateVehicleDto);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenantId || 'dummy-tenant-id';
    return this.vehiclesService.remove(tenantId, id);
  }
}
