import { Controller, Get, Post, Body, Patch, Param, Delete, Request } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { CreateRouteDto, UpdateRouteDto } from './dto/route.dto';

import { ApiTags } from '@nestjs/swagger';

@ApiTags('Routes')
@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Post()
  create(@Request() req: any, @Body() createRouteDto: CreateRouteDto) {
    const tenantId = req.user?.tenantId || 'dummy-tenant-id';
    return this.routesService.create(tenantId, createRouteDto);
  }

  @Get()
  findAll(@Request() req: any) {
    const tenantId = req.user?.tenantId || 'dummy-tenant-id';
    return this.routesService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenantId || 'dummy-tenant-id';
    return this.routesService.findOne(tenantId, id);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() updateRouteDto: UpdateRouteDto) {
    const tenantId = req.user?.tenantId || 'dummy-tenant-id';
    return this.routesService.update(tenantId, id, updateRouteDto);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenantId || 'dummy-tenant-id';
    return this.routesService.remove(tenantId, id);
  }
}
