import { Injectable } from '@nestjs/common';
import { UpdateProfileDto } from './dto/user.dto';
import { Multer } from 'multer';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthService } from 'src/auth/auth.service';
import { User } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService, private auth: AuthService) {}

    async updateProfile(dto: UpdateProfileDto, token: string) {
        const user = await this.auth.getUserFromToken(token);
        if (!user) {
            return null;
        }
        const updatedUser = await this.prisma.user.update({
            where: { id: user.id },
            data: {
                username: dto.username,
                firstName: dto.firstName ? dto.firstName : user.firstName,
                lastName: dto.lastName ? dto.lastName : user.lastName,
            },
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
                profilePicture: true,
            },
        });
        return user;
    }

    async updateProfilePictureAsFile(token: string, file: Multer.File) {
        const user = await this.auth.getUserFromToken(token);
        if (!user) {
            throw new Error('User not found');
        }

        const fileExtension = path.extname(file.originalname); // Get file extension
        const fileName = `${user.username}${fileExtension}`;
        const filePath = path.join('public', 'profile-pictures', fileName); // Path to save the file
        const urlPath = `/profile-pictures/${fileName}`; // URL to access the file

        // Ensure the directory exists
        const directoryPath = path.join('public', 'profile-pictures');
        if (!fs.existsSync(directoryPath)) {
            fs.mkdirSync(directoryPath, { recursive: true });
        }

        // Write the file to the file system
        fs.writeFileSync(filePath, file.buffer);

        // Update the user's profile picture path in the database
        await this.prisma.user.update({
            where: { id: user.id },
            data: { profilePicture: urlPath },
        });

        return urlPath; // Return the URL to access the profile picture
    }

    async getProfilePictureAsUrl(username: string): Promise<string | null> {
        const user = await this.prisma.user.findUnique({
            where: { username },
            select: { profilePicture: true },
        });

        if (!user || !user.profilePicture) {
            return null;
        }

        return user.profilePicture; // Return the URL stored in the database
    }
}
