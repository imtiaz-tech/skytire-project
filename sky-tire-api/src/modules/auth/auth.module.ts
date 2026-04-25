import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { MailModule } from '../../mail/mail.module';
import { DevicesModule } from '../devices/devices.module';
import { FingerprintService } from './fingerprint.service';

@Module({
  imports: [PrismaModule, MailModule, DevicesModule, HttpModule],
  controllers: [AuthController],
  providers: [AuthService, FingerprintService],
  exports: [AuthService],
})
export class AuthModule {}
