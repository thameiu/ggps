import { Injectable } from '@nestjs/common';
import { UpdateProfileDto } from './dto/user.dto';
import { Multer } from 'multer';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from 'src/auth/auth.service';
import { User } from '@prisma/client';

@Injectable()
export class UserService {

    
    constructor(private prisma: PrismaService, private auth:AuthService){}
   
    async updateProfile(dto: UpdateProfileDto) {
        const user = await this.auth.getUserFromToken(dto.token);
        if (!user) {
            return null;
        }
        const updatedUser = await this.prisma.user.update({
            where: { id: user.id },
            data: {
                username:dto.username,
                firstName:dto.firstName?dto.firstName:user.firstName,
                lastName:dto.lastName?dto.lastName:user.lastName,
            }
        });
        return updatedUser;
    }

    async findByUsername(username: string) {
        const user = await this.prisma.user.findUnique({
            where: { username },
            select: {
                hash: false,
                email: false,
                id: false,
                updateddAt: false,
                username: true,
                firstName: true,
                lastName: true,
                createdAt: true,
            },
        });
        return user;
    }

    async updateProfilePictureAsBlob(token: string, file: Multer.File) {
        const user = await this.auth.getUserFromToken(token);
        if (!user) {
            throw new Error('User not found');
        }
        
        await this.prisma.user.update({
            where: { id: user.id },
            data: { profilePicture: file.buffer }, 
        });
        return await this.getProfilePictureAsBlob(user.username);
    }
        
    async getProfilePictureAsBlob(username: string): Promise<Buffer> {
        const user = await this.prisma.user.findUnique({
            where: { username },
            select: { profilePicture: true },
        });
        
        if (!user || !user.profilePicture) {
            return null;
        }
        
        return user.profilePicture;
    }
        
}