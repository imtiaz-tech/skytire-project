import { Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { EmailTemplatesService } from './email-templates.service';

@Controller('admin/email-templates')
export class EmailTemplatesController {
  constructor(private readonly emailTemplatesService: EmailTemplatesService) {}

  @Post(':id/send')
  @HttpCode(HttpStatus.OK)
  sendToAllUsers(@Param('id') id: string) {
    return this.emailTemplatesService.sendToAllUsers(id);
  }
}
