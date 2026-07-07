import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';

@Injectable()
export class EmailTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async sendToAllUsers(id: string) {
    const template = await this.prisma.emailTemplate.findUnique({ where: { id } });
    if (!template) {
      throw new NotFoundException('Email template not found');
    }

    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        isSubscribed: true,
      },
      select: {
        email: true,
        name: true,
      },
    });

    if (users.length === 0) {
      return {
        message: 'No subscribed users found to send email to',
        sent: 0,
        failed: 0,
      };
    }

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      try {
        await this.mailService.sendEmail({
          to: user.email,
          subject: template.subject,
          html: template.html,
        });
        sent++;
      } catch (error) {
        console.error(`Failed to send template to ${user.email}:`, error);
        failed++;
      }
    }

    return {
      message:
        failed > 0
          ? `Email sent to ${sent} users. ${failed} failed.`
          : `Email sent successfully to ${sent} users`,
      sent,
      failed,
    };
  }
}
