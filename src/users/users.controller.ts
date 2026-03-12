import { Controller, Get, Post, Body, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateDriverDto } from './dto/driver.dto';

import { ApiTags } from '@nestjs/swagger';

@ApiTags('Users (Drivers)')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('drivers')
  createDriver(@Request() req: any, @Body() createDriverDto: CreateDriverDto) {
    const tenantId = req.user?.tenantId || 'dummy-tenant-id';
    return this.usersService.createDriver(tenantId, createDriverDto);
  }

  @Get('drivers')
  findAllDrivers(@Request() req: any) {
    const tenantId = req.user?.tenantId || 'dummy-tenant-id';
    return this.usersService.findAllDrivers(tenantId);
  }
}
