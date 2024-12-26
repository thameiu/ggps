import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
// import { AuthDto, LogDto } from "./dto";
import { AuthService } from "src/auth/auth.service";
import { TokenDto } from "src/auth/dto";
import { UpdateProfileDto } from "./dto/user.dto";
import { AuthGuard } from "src/auth/auth.guard";
import { UserService } from "./user.service";

@Controller('user')
export class UserController {
  constructor(private authService: AuthService, private userService: UserService) {}

    @Get('')
    @UseGuards(AuthGuard)
    @HttpCode(200)
    getProfile(@Query() dto: TokenDto) {
        return this.authService.getUserFromToken(dto.token);
    }

    @Put('')
    @UseGuards(AuthGuard)
    updateProfile(@Body() dto: UpdateProfileDto) {
        return this.userService.updateProfile(dto);
    }


    @Get('/:username')
    @UseGuards(AuthGuard)
    @HttpCode(200)
    getEventByUsername(@Param('username',) username: string) {
        return this.userService.findByUsername(username);
    }

}
