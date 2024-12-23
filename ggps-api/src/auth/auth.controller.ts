import { Body, Controller, HttpCode, ParseIntPipe, Post, Req, UnauthorizedException } from "@nestjs/common";
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
}
