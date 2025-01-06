import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { AuthService } from 'src/auth/auth.service';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';
import { MessageGateway } from './message.gateway';

@Module({
  imports: [AuthModule], 
  controllers: [MessageController],
  providers: [MessageService, MessageGateway, PrismaService, JwtService],
})
export class MessageModule {}
