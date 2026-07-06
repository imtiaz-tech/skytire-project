import { Body, Controller, HttpCode, HttpStatus, Param, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { PriceMatchQueriesService } from './price-match-queries.service';
import { SendPriceMatchReplyDto } from './dto/send-price-match-reply.dto';

@Controller('admin/price-match-queries')
export class PriceMatchQueriesController {
  constructor(private readonly priceMatchQueriesService: PriceMatchQueriesService) {}

  @Post(':id/send-email')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  sendReplyEmail(@Param('id') id: string, @Body() dto: SendPriceMatchReplyDto) {
    return this.priceMatchQueriesService.sendReplyEmail(id, dto);
  }
}
