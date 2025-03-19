import { Body, Controller, ForbiddenException, Get, HttpCode, ParseIntPipe, Post, Query, Req, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthDto, LogDto } from "./dto";

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LogDto) {
    return this.authService.login(dto);
  }

  @Post('signup')
  signup(@Body() dto: AuthDto) {
    return this.authService.signup(dto);
  }

  @Post('verify-token')
  @HttpCode(200)
  async verifyToken(@Req() req) {
    const token = req.headers['authorization'];
    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    try {
      return await this.authService.verifyToken(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Get('verify')
  async verifyEmail(
    @Query('token') token: string,
    @Query('jwt') jwtToken: string
  ) {
    if (!token || !jwtToken) {
      throw new ForbiddenException('Missing verification parameters');
    }
    return this.authService.verifyEmail(token, jwtToken);
  }

  @Post('request-password-reset')
  async requestPasswordReset(@Body('email') email: string) {
    if (!email) {
      throw new ForbiddenException('Email is required');
    }
    return this.authService.requestPasswordReset(email);
  }
  
  @Post('reset-password')
  async resetPassword(
    @Body('token') token: string, 
    @Body('newPassword') newPassword: string
  ) {
    if (!token || !newPassword) {
      throw new ForbiddenException('Token and new password are required');
    }
    return this.authService.resetPassword(token, newPassword);
  }
}
