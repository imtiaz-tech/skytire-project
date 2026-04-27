import { Injectable, UnauthorizedException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { hashPassword, comparePassword } from '../../lib/bcrypt';
import { generateUniqueMemberId } from '../../utils/generateMemberId';
import { SignupDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './auth.validation';
import * as crypto from 'crypto';
import { MailService } from '../../mail/mail.service';
import { forgotPasswordEmailTemplate } from '../../mail/templates/forgot-password.template';
import { ConfigService } from '@nestjs/config';
import { DevicesService } from '../devices/devices.service';
import { FingerprintService } from './fingerprint.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private configService: ConfigService,
    private devicesService: DevicesService,
    private fingerprintService: FingerprintService,
  ) {}

  async signup(dto: SignupDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await hashPassword(dto.password);
    const memberId = await generateUniqueMemberId(this.prisma as any);

    const { eventId, ...userData } = dto;

    const user = await this.prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        memberId,
        role: dto.role || 'DEFAULT_USER',
      },
    });

    // Register device if fingerprint eventId provided
    try {
      const eventData = await this.fingerprintService.getEventData(eventId);
      const fpData = {
        visitorId: eventData.products?.identification?.data?.visitorId,
        browserName: eventData.products?.identification?.data?.browserDetails?.browserName,
        browserVersion: eventData.products?.identification?.data?.browserDetails?.browserFullVersion,
        os: eventData.products?.identification?.data?.browserDetails?.os,
        device: eventData.products?.identification?.data?.browserDetails?.device,
        ipAddress: eventData.products?.ipInfo?.data?.v4?.address,
        city: eventData.products?.ipInfo?.data?.v4?.geolocation?.city?.name,
        country: eventData.products?.ipInfo?.data?.v4?.geolocation?.country?.name,
        vpnDetected: eventData.products?.vpn?.data?.result ?? false,
        proxyDetected: eventData.products?.proxy?.data?.result ?? false,
        botDetected: eventData.products?.botd?.data?.bot?.result === 'bad',
        incognito: eventData.products?.identification?.data?.incognito ?? false,
        firstSeenAt: eventData.products?.identification?.data?.firstSeenAt?.global ? new Date(eventData.products.identification.data.firstSeenAt.global) : new Date(),
        lastSeenAt: eventData.products?.identification?.data?.lastSeenAt?.global ? new Date(eventData.products.identification.data.lastSeenAt.global) : new Date(),
      };
      
      if (fpData.visitorId) {
        await this.devicesService.validateAndRegisterDevice(user.id, fpData);
      }
    } catch (err: any) {
      if (err instanceof ForbiddenException) {
        throw err;
      }
      console.error('Error fetching FP data in signup:', err.message);
    }

    const { password, ...result } = user;
    return { message: 'User registered successfully', user: result };
  }

  async login(dto: LoginDto, session: any) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await comparePassword(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated. Please contact support.');
    }

    // Device fraud check (throws ForbiddenException if banned)
    try {
      const eventData = await this.fingerprintService.getEventData(dto.eventId);
      const fpData = {
        visitorId: eventData.products?.identification?.data?.visitorId,
        browserName: eventData.products?.identification?.data?.browserDetails?.browserName,
        browserVersion: eventData.products?.identification?.data?.browserDetails?.browserFullVersion,
        os: eventData.products?.identification?.data?.browserDetails?.os,
        device: eventData.products?.identification?.data?.browserDetails?.device,
        ipAddress: eventData.products?.ipInfo?.data?.v4?.address,
        city: eventData.products?.ipInfo?.data?.v4?.geolocation?.city?.name,
        country: eventData.products?.ipInfo?.data?.v4?.geolocation?.country?.name,
        vpnDetected: eventData.products?.vpn?.data?.result ?? false,
        proxyDetected: eventData.products?.proxy?.data?.result ?? false,
        botDetected: eventData.products?.botd?.data?.bot?.result === 'bad',
        incognito: eventData.products?.identification?.data?.incognito ?? false,
        firstSeenAt: eventData.products?.identification?.data?.firstSeenAt?.global ? new Date(eventData.products.identification.data.firstSeenAt.global) : new Date(),
        lastSeenAt: eventData.products?.identification?.data?.lastSeenAt?.global ? new Date(eventData.products.identification.data.lastSeenAt.global) : new Date(),
      };
      
      if (fpData.visitorId) {
        await this.devicesService.validateAndRegisterDevice(user.id, fpData);
      }
    } catch (err: any) {
      if (err instanceof ForbiddenException) {
        throw err;
      }
      console.error('Error fetching FP data in login:', err.message);
    }

    // Store userId in session
    session.userId = user.id;

    const { password, ...result } = user;
    return { message: 'Login successful', user: result };
  }

  async getMe(session: any) {
    const userId = session?.userId;
    if (!userId) {
      throw new UnauthorizedException('Not authenticated');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const { password, resetPasswordToken, resetPasswordExpire, ...result } = user;
    return result;
  }

  async logout(session: any) {
    if (session) {
      await session.destroy();
    }
    return { message: 'Logout successful' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      return { message: 'If an account with that email exists, we sent a password reset link to it.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetPasswordExpire = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetTokenHash,
        resetPasswordExpire,
      },
    });

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const resetUrl = `${frontendUrl}/auth/reset-password/${resetToken}`;
    const projectLogo = this.configService.get<string>('PROJECT_LOGO', 'https://skytire.com/logo.png');
    const projectName = this.configService.get<string>('PROJECT_NAME', 'SkyTire');

    const html = forgotPasswordEmailTemplate(projectLogo, resetUrl, user.name);

    try {
      await this.mailService.sendEmail({
        to: user.email,
        subject: 'Reset your Sky Tire Account Password',
        html,
      });
    } catch (error) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { resetPasswordToken: null, resetPasswordExpire: null },
      });
      throw new BadRequestException('Email could not be sent');
    }

    return { message: 'Reset link sent to your email' };
  }

  async resetPassword(token: string, dto: ResetPasswordDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: resetTokenHash,
        resetPasswordExpire: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await hashPassword(dto.password);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpire: null,
      },
    });

    return { message: 'Password reset completely successfully' };
  }
}
