import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query, Req, UnauthorizedException, UseGuards, UseInterceptors, UploadedFile, Res, Headers } from "@nestjs/common";
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { Multer } from 'multer';
import { AuthGuard } from 'src/auth/auth.guard';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/user.dto';
import { AuthService } from 'src/auth/auth.service';
import { TokenDto } from 'src/auth/dto/auth.dto';

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

    @Get('/:username/profile-picture')
    @UseGuards(AuthGuard)
    async getProfilePictureAsBlob(@Param('username') username: string, @Res() res: Response) {
        const profilePicture = await this.userService.getProfilePictureAsBlob(username);

        res.set({
            'Content-Type': 'image/jpeg', 
            'Content-Disposition': `inline; filename="${username}-profile-picture.jpg"`,
        });

        res.send(profilePicture);
    }


    @Post('profile-picture')
    @UseGuards(AuthGuard)
    @UseInterceptors(
    FileInterceptor('file', {
        limits: { fileSize: 5 * 1024 * 1024 }, 
        fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
            return cb(new Error('Unsupported file format'), false);
        }
        cb(null, true);
        },
    }),
    )
    async uploadProfilePictureAsBlob(@UploadedFile() file: Multer.File, @Headers('authorization') token: string, ) {
        return await this.userService.updateProfilePictureAsBlob(token, file);
    }

}
