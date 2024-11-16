import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto, LogDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async login(dto: LogDto): Promise<{ token: string, user: any }> {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new ForbiddenException('Invalid credentials');
    }

    // Verify password
    const valid = await argon.verify(user.hash, dto.password);
    if (!valid) {
      throw new ForbiddenException('Invalid credentials');
    }

    // Generate JWT token (the only token issued)
    const payload = { userId: user.id, email: user.email };
    const token = this.jwtService.sign(payload);

    // Remove the password hash before returning the user data
    const { hash, ...userWithoutHash } = user;

    // Return token and user info
    return { token, user: userWithoutHash };
  }

  async signup(dto: AuthDto) {
    const hash = await argon.hash(dto.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          username: dto.username,
          hash,
        },
      });
      delete user.hash;
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
      const decoded = this.jwtService.decode(token) as { userId: number, email: string };
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId, email: decoded.email },
      });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      return this.jwtService.verifyAsync(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
