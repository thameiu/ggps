import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto, LogDto } from './dto';
import { Prisma } from '@prisma/client';
import { MailerService } from 'src/mailer/mailer.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private mailerService: MailerService,
  ) {}

  async login(dto: LogDto): Promise<{ token: string, user: any }> {
    try{
      const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (!user) {
        throw new ForbiddenException('Invalid credentials');
      }
  
      const valid = await argon.verify(user.hash, dto.password);
      if (!valid) {
        throw new ForbiddenException('Invalid credentials');
      }
  
      const payload = { userId: user.id, email: user.email };
      const token = this.jwtService.sign(payload);
  
      //TODO : remove validation token
      const { hash, ...userWithoutHash } = user;
  
      return { token, user: userWithoutHash };
    }catch(error){
      throw new ForbiddenException('An error has occured');
    }
  }

  async signup(dto: AuthDto) {
    const hash = await argon.hash(dto.password);
    const rawToken = randomBytes(32).toString('hex');
    const hashedToken = await argon.hash(rawToken);
  
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          username: dto.username,
          lastName: dto.lastName,
          firstName: dto.firstName,
          hash,
          verificationToken: hashedToken,
        },
      });
      delete user.hash;
  
      const confirmLink = `http://localhost:3000/verify-email?token=${rawToken}`;
  
      await this.mailerService.sendMail(
        user.email,
        'Confirm your GGPS account',
        `Bonjour ${user.firstName},\n\nPlease confirm your email by clicking this link: ${confirmLink}`
      );
  
      return user;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Username or email taken');
        }
      }
      throw error;
    }
  }
  

  async verifyToken(token: string) {
    try {
      const decoded = await this.jwtService.verifyAsync(token);
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId, email: decoded.email },
      });
  
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      return { valid: true, user };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }
      throw new UnauthorizedException('Invalid token');
    }
  }
  

  async getUserFromToken(token: string) {
    try {
      const decoded = this.jwtService.decode(token) as { userId: number, email: string };
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId, email: decoded.email },
      });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      const { hash, ...userWithoutHash } = user;
      return userWithoutHash;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async verifyEmail(token: string) {
    const users = await this.prisma.user.findMany({
      where: { verificationToken: { not: null } },
    });
  
    if (!users.length) {
      throw new ForbiddenException('Invalid or expired verification token');
    }
  
    let matchedUser = null;
  
    for (const user of users) {
      if (await argon.verify(user.verificationToken, token)) {
        matchedUser = user;
        break;
      }
    }
  
    if (!matchedUser) {
      throw new ForbiddenException('Invalid or expired verification token');
    }
  
    await this.prisma.user.update({
      where: { id: matchedUser.id },
      data: { verified: true, verificationToken: null },
    });
  
    return { message: 'Email verified successfully' };
  }
  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
  
    if (!user) {
      throw new ForbiddenException('Email not found');
    }
  
    const rawToken = randomBytes(32).toString('hex');
    const hashedToken = await argon.hash(rawToken);
  
    await this.prisma.user.update({
      where: { email },
      data: { resetToken: hashedToken },
    });
  
    const resetLink = `http://localhost:3000/reset-password?token=${rawToken}`;
  
    await this.mailerService.sendMail(
      user.email,
      'Reset Your Password',
      `Hello ${user.firstName},\n\nClick this link to reset your password: ${resetLink}`
    );
  
    return { message: 'Password reset email sent' };
  }
  
  async resetPassword(token: string, newPassword: string) {
    const users = await this.prisma.user.findMany({
      where: { resetToken: { not: null } },
    });
  
    if (!users.length) {
      throw new ForbiddenException('Invalid reset token');
    }
  
    let matchedUser = null;
  
    for (const user of users) {
      if (await argon.verify(user.resetToken, token)) {
        matchedUser = user;
        break;
      }
    }
  
    if (!matchedUser) {
      throw new ForbiddenException('Invalid reset token');
    }
  
    const hashedPassword = await argon.hash(newPassword);
  
    await this.prisma.user.update({
      where: { id: matchedUser.id },
      data: { hash: hashedPassword, resetToken: null },
    });
  
    return { message: 'Password reset successfully' };
  }
  
}
