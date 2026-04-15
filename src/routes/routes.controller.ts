import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Request, UseGuards } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { CreateRouteDto, UpdateRouteDto } from './dto/route.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Routes')
@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  /** Public: list all routes (for /rotalar page) */
  @Get('public')
  findAllPublic(@Query('q') q?: string) {
    return this.routesService.findAllPublic(q);
  }

  /** Public: popular routes for landing page */
  @Get('public/popular')
  findPopularPublic(@Query('limit') limit?: string) {
    return this.routesService.findPopularPublic(limit ? Number(limit) : 8);
  }

  /** Public: platform-wide aggregate stats for landing ticker */
  @Get('public/stats')
  findPublicStats() {
    return this.routesService.findPublicStats();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(@Request() req: any, @Body() createRouteDto: CreateRouteDto) {
    return this.routesService.create(req.user.tenantId, createRouteDto, req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findAll(@Request() req: any) {
    const tenantId = req.user.tenantId;
    return this.routesService.findAll(tenantId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findOne(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.routesService.findOne(tenantId, id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(@Request() req: any, @Param('id') id: string, @Body() updateRouteDto: UpdateRouteDto) {
    return this.routesService.update(req.user.tenantId, id, updateRouteDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  remove(@Request() req: any, @Param('id') id: string) {
    return this.routesService.remove(req.user.tenantId, id, req.user.id);
  }
}
