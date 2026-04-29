import { Module } from '@nestjs/common';
import { TiresService } from './tires.service';
import { TiresController } from './tires.controller';

@Module({
  controllers: [TiresController],
  providers: [TiresService],
})
export class TiresModule {}
