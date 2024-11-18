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

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }),PrismaModule, AuthModule, UserModule, EventModule, SeederModule, MessageModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
