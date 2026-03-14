import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateStationDto, UpdateStationDto } from './dto/station.dto';

@Injectable()
export class StationsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, createDto: CreateStationDto) {
    return this.prisma.station.create({
      data: {
        ...createDto,
        tenantId,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.station.findMany({
      where: { tenantId },
    });
  }

  async findOne(tenantId: string, id: string) {
    const station = await this.prisma.station.findFirst({
      where: { id, tenantId },
    });
    if (!station) {
      throw new NotFoundException('Station not found');
    }
    return station;
  }

  async update(tenantId: string, id: string, updateDto: UpdateStationDto) {
    await this.findOne(tenantId, id);
    return this.prisma.station.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.station.delete({
      where: { id },
    });
  }
}
