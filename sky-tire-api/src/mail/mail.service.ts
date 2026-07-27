import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Attachment } from 'nodemailer/lib/mailer';
import { prepareHtmlForEmailSend } from './inline-email-images';

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Attachment[];
}

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT', 465),
      secure: true,
      auth: {
        user: this.configService.get<string>('SMTP_MAIL'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
    });
  }

  async sendEmail({ to, subject, html, text, cc, bcc, attachments }: SendMailOptions) {
    const from = this.configService.get<string>('SMTP_MAIL');

    // Link images via public /uploads URLs — do NOT CID-embed them.
    // Gmail always lists CID images under "Attachments".
    const prepared = await prepareHtmlForEmailSend(html);

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"Sky Tire" <${from}>`,
      to,
      subject,
      html: prepared.html,
      ...(text ? { text } : {}),
      cc,
      bcc,
      // Only real file attachments from caller — never image CID parts
      ...(attachments && attachments.length > 0 ? { attachments } : {}),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[mail] sent to ${to} (linked images, no CID), messageId=${info.messageId}`);
      return info;
    } catch (error) {
      console.error('Mail sending failed:', error);
      throw error;
    }
  }
}
