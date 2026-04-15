import { Module, Global } from '@nestjs/common';
import { CityImageService } from './city-image.service';
import { CityImageController } from './city-image.controller';

@Global()
@Module({
  providers: [CityImageService],
  controllers: [CityImageController],
  exports: [CityImageService],
})
export class CityImageModule {}
