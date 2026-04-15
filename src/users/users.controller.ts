import { Controller, Get, Post, Patch, Delete, Body, Param, Request, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateDriverDto, UpdateDriverDto } from './dto/driver.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Users (Drivers)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('drivers')
  createDriver(@Request() req: any, @Body() createDriverDto: CreateDriverDto) {
    return this.usersService.createDriver(req.user.tenantId, createDriverDto, req.user.id);
  }

  @Get('drivers')
  findAllDrivers(@Request() req: any) {
    return this.usersService.findAllDrivers(req.user.tenantId);
  }

  @Patch('drivers/:id')
  updateDriver(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateDriverDto) {
    return this.usersService.updateDriver(req.user.tenantId, id, dto, req.user.id);
  }

  @Delete('drivers/:id')
  deleteDriver(@Request() req: any, @Param('id') id: string) {
    return this.usersService.deleteDriver(req.user.tenantId, id, req.user.id);
  }
}
