import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MailerService } from 'src/mailer/mailer.service';

@Module({
  imports: [
    JwtModule.register({
      secret: 'njbuy5zsfejghe_sfhcvejsdfe**$^pdfeczighvyhfjgvhb huhv zeif*$^$ù!:^;o;h234567890982=+KJxbétyz  fd"èiyd gèz-  tdn zgzufd yt -(-fyt "oéédy67_ç', 
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [AuthService, MailerService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
