import { 
    Body, 
    Controller, 
    Get, 
    HttpCode, 
    Param, 
    ParseIntPipe, 
    Post, 
    Put, 
    Query, 
    Req, 
    UnauthorizedException, 
    UseGuards, 
    UseInterceptors, 
    UploadedFile, 
    Res, 
    Headers 
} from "@nestjs/common";
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
constructor(
    private authService: AuthService, 
    private userService: UserService
) {}

@Get('')
@UseGuards(AuthGuard)
@HttpCode(200)
getProfile(@Query() dto: TokenDto) {
    return this.authService.getUserFromToken(dto.token);
}

@Put('')
@UseGuards(AuthGuard)
updateProfile(@Body() dto: UpdateProfileDto, @Headers('authorization') token: string) {
    return this.userService.updateProfile(dto, token);
}

@Get('/:username')
@UseGuards(AuthGuard)
@HttpCode(200)
getEventByUsername(@Param('username') username: string) {
    return this.userService.findByUsername(username);
}

@Get('/:username/profile-picture')
async getProfilePictureAsUrl(
    @Param('username') username: string, 
    @Res() res: Response
) {
    const profilePictureUrl = await this.userService.getProfilePictureAsUrl(username);
    if (!profilePictureUrl) {
    res.status(404).send({ message: 'Profile picture not found' });
    return;
    }

    res.redirect(profilePictureUrl);
}

@Post('profile-picture')
@UseGuards(AuthGuard)
@UseInterceptors(
    FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
        return cb(new Error('Unsupported file format'), false);
        }
        cb(null, true);
    },
    }),
)
async uploadProfilePictureAsFile(
    @UploadedFile() file: Multer.File, 
    @Headers('authorization') token: string
) {
    return await this.userService.updateProfilePictureAsFile(token, file);
}
}
