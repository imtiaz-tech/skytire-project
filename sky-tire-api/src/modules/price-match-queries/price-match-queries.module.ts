import { Module } from '@nestjs/common';
import { PriceMatchQueriesController } from './price-match-queries.controller';
import { PriceMatchQueriesService } from './price-match-queries.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { MailModule } from '../../mail/mail.module';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [PriceMatchQueriesController],
  providers: [PriceMatchQueriesService],
})
export class PriceMatchQueriesModule {}
