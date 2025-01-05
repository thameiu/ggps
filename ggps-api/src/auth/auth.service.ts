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
  
      const { hash, ...userWithoutHash } = user;
  
      return { token, user: userWithoutHash };
    }catch(error){
      throw new ForbiddenException('An error has occured');
    }
  }

  async signup(dto: AuthDto) {
    const hash = await argon.hash(dto.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          username: dto.username,
          lastName: dto.lastName,
          firstName: dto.firstName,
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
}
