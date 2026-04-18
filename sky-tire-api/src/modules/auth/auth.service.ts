import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { hashPassword, comparePassword } from '../../lib/bcrypt';
import { signToken } from '../../lib/jwt';
import { generateUniqueMemberId } from '../../utils/generateMemberId';
import { SignupDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './auth.validation';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter;

  constructor(private prisma: PrismaService) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtpout.secureserver.net',
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_MAIL || 'info@skytire.com',
        pass: process.env.SMTP_PASSWORD || 'SkyTireBusinessBy@26Wala',
      },
    });
  }

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

    const user = await this.prisma.user.create({
      data: {
        ...dto,
        password: hashedPassword,
        memberId,
        role: dto.role || 'DEFAULT_USER',
      },
    });

    const { password, ...result } = user;
    const token = signToken({ userId: user.id, role: user.role, email: user.email });

    return { message: 'User registered successfully', user: result, token };
  }

  async login(dto: LoginDto) {
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
      throw new UnauthorizedException('Account is disabled');
    }

    const token = signToken({ userId: user.id, role: user.role, email: user.email });
    const { password, ...result } = user;

    return { message: 'Login successful', user: result, token };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
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

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/auth/reset-password/${resetToken}`;

    const mailOptions = {
      from: `"Sky Tire" <${process.env.SMTP_MAIL || 'info@skytire.com'}>`,
      to: user.email,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Please go to this link to reset your password: ${resetUrl}`,
      html: `
        <p>You requested a password reset.</p>
        <p>Please click this <a href="${resetUrl}">link</a> to reset your password.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      // Revert token if email fails
      await this.prisma.user.update({
        where: { id: user.id },
        data: { resetPasswordToken: null, resetPasswordExpire: null },
      });
      console.error('Email error:', error);
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
