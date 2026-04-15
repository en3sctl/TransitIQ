import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CityImageService } from './city-image.service';

@ApiTags('City Image')
@Controller('city-image')
export class CityImageController {
  constructor(private readonly cityImage: CityImageService) {}

  /** Public: get a landmark image URL for a city (via Wikipedia). */
  @Get()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async get(@Query('city') city: string) {
    return this.cityImage.getImageForCity(city || '');
  }
}
