import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { EventModule } from './event/event.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { SeederModule } from './seeder/seeder.module';
import { MessageModule } from './message/message.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { MailerService } from './mailer/mailer.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      ttl: 1000,
      limit: 1,
    }]),
    PrismaModule, 
    AuthModule, 
    UserModule, 
    EventModule, 
    SeederModule, 
    MessageModule
  ],
  controllers: [AppController],
  providers: [AppService, MailerService],
})
export class AppModule { }
