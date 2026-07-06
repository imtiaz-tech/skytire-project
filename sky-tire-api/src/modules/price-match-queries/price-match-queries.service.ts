import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { SendPriceMatchReplyDto } from './dto/send-price-match-reply.dto';
import {
  buildPriceMatchReplyHtml,
  buildPriceMatchReplyText,
  getEmailTypoSuggestion,
} from '../../mail/templates/price-match-reply.template';

@Injectable()
export class PriceMatchQueriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async sendReplyEmail(id: string, dto: SendPriceMatchReplyDto) {
    const query = await this.prisma.priceMatchQuery.findUnique({ where: { id } });
    if (!query) {
      throw new NotFoundException('Price match query not found');
    }

    const recipient = (dto.to?.trim() || query.email).trim();
    const subject = dto.subject.trim();
    const message = dto.message.trim();

    if (!recipient) {
      throw new BadRequestException('Recipient email is required');
    }

    const typoSuggestion = getEmailTypoSuggestion(recipient);
    if (typoSuggestion && recipient.toLowerCase() === query.email.toLowerCase()) {
      throw new BadRequestException(
        `The stored email "${query.email}" looks like a typo. Did you mean "${typoSuggestion}"? Correct the recipient address before sending.`,
      );
    }

    const html = buildPriceMatchReplyHtml(query.fullName, message);
    const text = buildPriceMatchReplyText(query.fullName, message);
    const senderEmail = this.configService.get<string>('SMTP_MAIL');

    const info = await this.mailService.sendEmail({
      to: recipient,
      subject,
      html,
      text,
      bcc: senderEmail,
    });

    if (dto.to?.trim() && dto.to.trim() !== query.email) {
      await this.prisma.priceMatchQuery.update({
        where: { id },
        data: { email: dto.to.trim() },
      });
    }

    return {
      message: `Email sent successfully to ${recipient}`,
      messageId: info.messageId,
      accepted: info.accepted,
    };
  }
}
