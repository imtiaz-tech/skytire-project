import { Module } from '@nestjs/common';
import { TiresService } from './tires.service';
import { TiresController } from './tires.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TiresController],
  providers: [TiresService],
})
export class TiresModule {}
