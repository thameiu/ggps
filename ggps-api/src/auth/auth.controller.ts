import { Body, Controller, ParseIntPipe, Post, Req } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthDto, LogDto } from "./dto";

@Controller('auth')
export class AuthController {
    constructor(private authService : AuthService){
    }

    @Post('login')
    login(@Body() dto: LogDto){
        return this.authService.login(dto);
    };

    @Post('signup')
    signup(@Body() dto: AuthDto){
        return this.authService.signup(dto);
    };

    
}